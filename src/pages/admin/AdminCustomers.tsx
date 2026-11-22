import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/inventory';

// Website accounts (user_profiles) and walk-in customers saved by Record Sale (offline_customers),
// shown together. Offline customers are tagged so they're easy to tell apart.
interface CustomerRow {
  key: string;
  kind: 'online' | 'offline';
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  since: string;
  orders: number;
  spent: number;
}

type Filter = 'all' | 'online' | 'offline';

const initials = (name: string, fallback: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const text = parts.length ? parts[0][0] + (parts[1]?.[0] ?? '') : fallback[0] ?? '?';
  return text.toUpperCase();
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const [profiles, offline, orders] = await Promise.all([
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('offline_customers').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('user_id, offline_customer_id, total_price, order_status'),
      ]);

      if (profiles.error) {
        toast({ title: 'Error loading customers', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Totals per customer (cancelled orders don't count).
      const totals = new Map<string, { orders: number; spent: number }>();
      for (const o of orders.data ?? []) {
        if (o.order_status === 'cancelled') continue;
        const key = o.offline_customer_id ? `offline:${o.offline_customer_id}` : o.user_id ? `online:${o.user_id}` : null;
        if (!key) continue;
        const t = totals.get(key) ?? { orders: 0, spent: 0 };
        t.orders += 1;
        t.spent += Number(o.total_price);
        totals.set(key, t);
      }

      const online: CustomerRow[] = (profiles.data ?? []).map((p) => {
        const key = `online:${p.user_id}`;
        return {
          key,
          kind: 'online',
          name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.display_name || '',
          email: p.email,
          phone: p.phone,
          role: p.role,
          since: p.created_at,
          orders: totals.get(key)?.orders ?? 0,
          spent: totals.get(key)?.spent ?? 0,
        };
      });

      // Before the inventory database update is run, this table doesn't exist yet: just skip it.
      const walkIns: CustomerRow[] = (offline.error ? [] : offline.data ?? []).map((c) => {
        const key = `offline:${c.id}`;
        return {
          key,
          kind: 'offline',
          name: c.name,
          email: null,
          phone: c.phone,
          role: null,
          since: c.created_at,
          orders: totals.get(key)?.orders ?? 0,
          spent: totals.get(key)?.spent ?? 0,
        };
      });

      setCustomers([...online, ...walkIns].sort((a, b) => b.since.localeCompare(a.since)));
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  const counts = useMemo(
    () => ({
      all: customers.length,
      online: customers.filter((c) => c.kind === 'online').length,
      offline: customers.filter((c) => c.kind === 'offline').length,
    }),
    [customers],
  );

  const filtered = customers.filter((c) => {
    if (filter !== 'all' && c.kind !== filter) return false;
    const q = search.toLowerCase();
    return [c.name, c.email ?? '', c.phone ?? ''].some((t) => t.toLowerCase().includes(q));
  });

  const tabs: { value: Filter; label: string }[] = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'online', label: `Website (${counts.online})` },
    { value: 'offline', label: `Offline (${counts.offline})` },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-luxury font-semibold">Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {counts.online} website accounts · {counts.offline} offline customers (saved when you record an in-store sale)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex rounded-lg border bg-card p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilter(t.value)}
              className={cn('px-3 py-1.5 text-sm rounded-md transition-colors', filter === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No customers found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((c) => (
                <div key={c.key} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-full gradient-luxury flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-foreground">{initials(c.name, c.email ?? c.phone ?? '?')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.kind === 'offline' ? c.phone : c.email || 'No email'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    {c.kind === 'online' && c.phone && <span className="text-sm text-muted-foreground hidden md:block">{c.phone}</span>}
                    <span className="text-xs text-muted-foreground hidden sm:block tabular-nums">
                      {c.orders} order{c.orders === 1 ? '' : 's'} · {formatINR(c.spent)}
                    </span>
                    {c.kind === 'offline' ? (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">Offline customer</Badge>
                    ) : (
                      <Badge variant={c.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">{c.role || 'customer'}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground hidden lg:block">
                      {c.kind === 'offline' ? 'First visit' : 'Joined'} {new Date(c.since).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
