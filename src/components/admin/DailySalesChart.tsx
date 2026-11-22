import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/inventory';

// Daily sales for the last N days, split into online orders and in-store sales.
// Cancelled orders are left out. Used on both the Store Admin and Inventory dashboards.

const ONLINE_COLOR = 'hsl(15, 35%, 52%)';
const STORE_COLOR = 'hsl(40, 70%, 52%)';

interface OrderRow {
  total_price: number;
  created_at: string | null;
  order_status: string | null;
  channel?: string | null;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const compactINR = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${Math.round(v)}`);

export function DailySalesChart({ days = 30, title = 'Daily sales' }: { days?: number; title?: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - (days - 1));
      const query = (columns: string) =>
        supabase.from('orders').select(columns).gte('created_at', since.toISOString()).order('created_at', { ascending: true });
      let res = await query('total_price, created_at, order_status, channel');
      // Before the inventory database update there is no "channel" column: everything counts as online.
      if (res.error) res = await query('total_price, created_at, order_status');
      setOrders(((res.data ?? []) as unknown) as OrderRow[]);
      setLoading(false);
    })();
  }, [days]);

  const data = useMemo(() => {
    const byDay = new Map<string, { label: string; online: number; store: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      byDay.set(dayKey(d), { label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), online: 0, store: 0 });
    }
    for (const o of orders) {
      if (!o.created_at || o.order_status === 'cancelled') continue;
      const row = byDay.get(dayKey(new Date(o.created_at)));
      if (!row) continue;
      if (o.channel === 'store') row.store += Number(o.total_price);
      else row.online += Number(o.total_price);
    }
    return [...byDay.values()];
  }, [orders, days]);

  const totals = useMemo(
    () => data.reduce((t, d) => ({ online: t.online + d.online, store: t.store + d.store }), { online: 0, store: 0 }),
    [data],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-base">{title} · last {days} days</CardTitle>
          <p className="text-sm text-muted-foreground tabular-nums">
            Total <strong className="text-foreground">{formatINR(totals.online + totals.store)}</strong> · Online {formatINR(totals.online)} · In-store {formatINR(totals.store)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64" role="img" aria-label={`${title}: online ${formatINR(totals.online)}, in-store ${formatINR(totals.store)} over the last ${days} days`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" minTickGap={16} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={compactINR} width={56} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => [formatINR(value), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="online" name="Online" stackId="sales" fill={ONLINE_COLOR} maxBarSize={28} />
                <Bar dataKey="store" name="In-store" stackId="sales" fill={STORE_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
