import { useEffect, useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MOVEMENT_REASON_LABEL, errorMessage } from '@/lib/inventory';

type Movement = Tables<'stock_movements'>;
const LIMIT = 500;

export default function StockHistory() {
  const [rows, setRows] = useState<Movement[]>([]);
  const [admins, setAdmins] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(LIMIT);
      if (error) {
        toast({ title: 'Could not load stock history', description: errorMessage(error), variant: 'destructive' });
      } else {
        setRows(data ?? []);
        // Show who made each change by name/email instead of an id.
        const ids = [...new Set((data ?? []).map((r) => r.created_by).filter((id): id is string => !!id))];
        if (ids.length) {
          const { data: people } = await supabase.from('user_profiles').select('user_id, first_name, email').in('user_id', ids);
          setAdmins(Object.fromEntries((people ?? []).map((p) => [p.user_id, p.first_name || p.email || 'Admin'])));
        }
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (reason === 'all' || r.reason === reason) &&
        (!q || [r.product_name, r.sku, r.color, r.size, r.note].some((t) => (t ?? '').toLowerCase().includes(q))),
    );
  }, [rows, search, reason]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-luxury font-semibold">Stock History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every change to stock: online orders, in-store sales, restocks, corrections and cancellations. Latest {LIMIT} shown.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search product, SKU, colour, size or note" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reasons</SelectItem>
            {Object.entries(MOVEMENT_REASON_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{rows.length === 0 ? 'No stock changes recorded yet.' : 'Nothing matches your search.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">When</th>
                    <th className="text-left font-medium px-4 py-3">Item</th>
                    <th className="text-left font-medium px-4 py-3">Reason</th>
                    <th className="text-right font-medium px-4 py-3">Change</th>
                    <th className="text-right font-medium px-4 py-3">Stock</th>
                    <th className="text-left font-medium px-4 py-3">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.product_name ?? 'Deleted item'}</div>
                        <div className="text-xs text-muted-foreground">{[r.color, r.size].filter(Boolean).join(' / ')}{r.sku ? ` · ${r.sku}` : ''}</div>
                        {r.note && <div className="text-xs italic text-muted-foreground">“{r.note}”</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{MOVEMENT_REASON_LABEL[r.reason] ?? r.reason}</Badge>
                        {r.order_id && <div className="text-xs text-muted-foreground mt-1 font-mono">#{r.order_id.slice(-10).toUpperCase()}</div>}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${r.change > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {r.change > 0 ? `+${r.change}` : r.change}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{r.stock_before} → <strong>{r.stock_after}</strong></td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.created_by ? admins[r.created_by] ?? 'Admin' : r.reason === 'online_order' ? 'Customer (website)' : 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
