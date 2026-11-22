import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, IndianRupee, PackageX, ScanBarcode, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  InventoryItem, MOVEMENT_REASON_LABEL, STOCK_STATUS_CLASS, STOCK_STATUS_LABEL, errorMessage, fetchInventoryItems,
  formatINR, optionLabel, stockStatus,
} from '@/lib/inventory';

interface RecentMovement {
  id: string;
  product_name: string | null;
  color: string | null;
  size: string | null;
  change: number;
  reason: string;
  created_at: string;
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [recent, setRecent] = useState<RecentMovement[]>([]);
  const [storeToday, setStoreToday] = useState({ count: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const [inventory, movements, sales] = await Promise.all([
          fetchInventoryItems(),
          supabase.from('stock_movements').select('id, product_name, color, size, change, reason, created_at').order('created_at', { ascending: false }).limit(8),
          supabase.from('orders').select('total_price').eq('channel', 'store').neq('order_status', 'cancelled').gte('created_at', startOfDay.toISOString()),
        ]);
        setItems(inventory);
        if (movements.error) throw movements.error;
        if (sales.error) throw sales.error;
        setRecent(movements.data ?? []);
        setStoreToday({
          count: sales.data?.length ?? 0,
          revenue: (sales.data ?? []).reduce((s, o) => s + Number(o.total_price), 0),
        });
      } catch (e) {
        toast({ title: 'Could not load inventory', description: errorMessage(e), variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const units = items.reduce((s, i) => s + i.stock, 0);
    return {
      skus: items.length,
      units,
      costValue: items.reduce((s, i) => s + i.stock * (i.costPrice ?? 0), 0),
      retailValue: items.reduce((s, i) => s + i.stock * i.price, 0),
      missingCost: items.filter((i) => i.stock > 0 && i.costPrice === null).length,
      low: items.filter((i) => stockStatus(i.stock, i.lowThreshold) === 'low').length,
      out: items.filter((i) => stockStatus(i.stock, i.lowThreshold) === 'out').length,
    };
  }, [items]);

  const attention = useMemo(
    () =>
      items
        .filter((i) => stockStatus(i.stock, i.lowThreshold) !== 'in')
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10),
    [items],
  );

  const cards = [
    { label: 'Items (colour/size)', value: String(stats.skus), sub: `${stats.units} units in stock`, icon: Boxes },
    {
      label: 'Stock value (selling price)',
      value: formatINR(stats.retailValue),
      sub: `${formatINR(stats.costValue)} at cost${stats.missingCost ? ` · ${stats.missingCost} items have no cost price` : ''}`,
      icon: IndianRupee,
    },
    { label: 'Low stock', value: String(stats.low), sub: 'At or below their low-stock level', icon: AlertTriangle },
    { label: 'Out of stock', value: String(stats.out), sub: 'Shown as "Out of stock" on the website', icon: PackageX },
    { label: 'In-store sales today', value: formatINR(storeToday.revenue), sub: `${storeToday.count} sale${storeToday.count === 1 ? '' : 's'}`, icon: Store },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-luxury font-semibold">Inventory Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Stock across the website and your store, in one place.</p>
        </div>
        <Button asChild>
          <Link to="/inventory/sale"><ScanBarcode className="w-4 h-4 mr-2" /> Record a sale</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              {loading ? <Skeleton className="h-8 w-24 mt-2" /> : <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>}
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Needs restocking</CardTitle>
            <Button asChild variant="link" size="sm"><Link to="/inventory/stock">View all stock</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : attention.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">Everything is well stocked.</p>
            ) : (
              <div className="divide-y">
                {attention.map((i) => {
                  const s = stockStatus(i.stock, i.lowThreshold);
                  return (
                    <div key={i.id} className="flex items-center gap-3 px-6 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{i.productName}</p>
                        <p className="text-xs text-muted-foreground">{optionLabel(i)} · code {i.itemCode} · low at {i.lowThreshold}</p>
                      </div>
                      <span className="font-semibold tabular-nums">{i.stock}</span>
                      <Badge variant="outline" className={STOCK_STATUS_CLASS[s]}>{STOCK_STATUS_LABEL[s]}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent stock changes</CardTitle>
            <Button asChild variant="link" size="sm"><Link to="/inventory/history">Full history</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : recent.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">No stock changes recorded yet.</p>
            ) : (
              <div className="divide-y">
                {recent.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.product_name ?? 'Deleted item'}</p>
                      <p className="text-xs text-muted-foreground">
                        {[m.color, m.size].filter(Boolean).join(' / ')} · {MOVEMENT_REASON_LABEL[m.reason] ?? m.reason} ·{' '}
                        {new Date(m.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <span className={`font-semibold tabular-nums ${m.change > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {m.change > 0 ? `+${m.change}` : m.change}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
