import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Download, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  ADJUST_REASONS, InventoryItem, STOCK_STATUS_CLASS, STOCK_STATUS_LABEL, StockStatus, downloadCsv, errorMessage,
  fetchInventoryItems, formatINR, isLive, optionLabel, stockStatus,
} from '@/lib/inventory';

type StatusFilter = 'all' | StockStatus | 'live' | 'hidden';

export default function InventoryStock() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchInventoryItems());
    } catch (e) {
      toast({ title: 'Could not load stock', description: errorMessage(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const s = stockStatus(i.stock, i.lowThreshold);
      const matchesStatus =
        status === 'all' ||
        (status === 'live' && isLive(i)) ||
        (status === 'hidden' && !isLive(i)) ||
        status === s;
      const matchesSearch =
        !q || [i.itemCode, i.sku, i.productName, i.color, i.size ?? ''].some((t) => t.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, status]);

  const exportCsv = () =>
    downloadCsv(
      `stock-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Code', 'SKU', 'Product', 'Category', 'Colour', 'Size', 'Cost price', 'Selling price', 'Stock', 'Low stock at', 'Status', 'On website'],
      rows.map((i) => [
        i.itemCode, i.sku, i.productName, i.category, i.color, i.size, i.costPrice, i.price, i.stock, i.lowThreshold,
        STOCK_STATUS_LABEL[stockStatus(i.stock, i.lowThreshold)], isLive(i) ? 'Yes' : 'No',
      ]),
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-luxury font-semibold">Stock</h1>
          <p className="text-muted-foreground text-sm mt-1">
            One row per colour and size. The website, online orders and in-store sales all use these numbers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button asChild>
            <Link to="/inventory/products"><Plus className="w-4 h-4 mr-2" /> Add product</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by code, SKU, product, colour or size" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="in">In stock</SelectItem>
            <SelectItem value="low">Low stock</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
            <SelectItem value="live">Live on website</SelectItem>
            <SelectItem value="hidden">Hidden from website</SelectItem>
          </SelectContent>
        </Select>
        <span className="self-center text-sm text-muted-foreground ml-auto">{rows.length} of {items.length} items</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Boxes className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{items.length === 0 ? 'No products yet. Add one under Products.' : 'Nothing matches your search.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Code</th>
                    <th className="text-left font-medium px-4 py-3">Product</th>
                    <th className="text-left font-medium px-4 py-3">Colour / Size</th>
                    <th className="text-right font-medium px-4 py-3">Price</th>
                    <th className="text-right font-medium px-4 py-3">Stock</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Website</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((i) => {
                    const s = stockStatus(i.stock, i.lowThreshold);
                    return (
                      <tr key={i.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold">{i.itemCode || '—'}</div>
                          <div className="font-mono text-xs text-muted-foreground">{i.sku}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{i.productName}</div>
                          {i.category && <div className="text-xs text-muted-foreground">{i.category}</div>}
                        </td>
                        <td className="px-4 py-3">{optionLabel(i) || '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatINR(i.price)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{i.stock}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={STOCK_STATUS_CLASS[s]}>{STOCK_STATUS_LABEL[s]}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isLive(i) ? 'default' : 'secondary'} className="text-xs">{isLive(i) ? 'Live' : 'Hidden'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setAdjusting(i)}>Change stock</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AdjustStockDialog item={adjusting} onClose={() => setAdjusting(null)} onSaved={load} />
    </div>
  );
}

function AdjustStockDialog({ item, onClose, onSaved }: { item: InventoryItem | null; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState<string>('restock');
  const [quantity, setQuantity] = useState('');
  const [direction, setDirection] = useState<'add' | 'remove'>('add');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setReason('restock');
      setQuantity('');
      setDirection('add');
      setNote('');
    }
  }, [item]);

  const fixed = ADJUST_REASONS.find((r) => r.value === reason)?.direction ?? 0;
  const sign = fixed !== 0 ? fixed : direction === 'add' ? 1 : -1;
  const amount = Number(quantity);
  const valid = Number.isInteger(amount) && amount > 0;
  const newStock = item ? item.stock + sign * (valid ? amount : 0) : 0;

  const save = async () => {
    if (!item || !valid) return;
    if (newStock < 0) {
      toast({ title: 'Stock cannot go below 0', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('adjust_stock', {
      p_variant_id: item.id,
      p_change: sign * amount,
      p_reason: reason,
      p_note: note.trim() || undefined,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Stock not changed', description: errorMessage(error), variant: 'destructive' });
      return;
    }
    toast({ title: 'Stock updated', description: `${item.productName} (${optionLabel(item)}): ${item.stock} → ${newStock}` });
    onClose();
    onSaved();
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-luxury">Change stock</DialogTitle>
          <DialogDescription>
            {item && <>{item.productName} · {optionLabel(item)} · code {item.itemCode} · now <strong>{item.stock}</strong> in stock</>}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADJUST_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {fixed === 0 && (
            <div className="flex gap-2">
              <Button type="button" variant={direction === 'add' ? 'default' : 'outline'} className="flex-1" onClick={() => setDirection('add')}>Add</Button>
              <Button type="button" variant={direction === 'remove' ? 'default' : 'outline'} className="flex-1" onClick={() => setDirection('remove')}>Remove</Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="adjust-qty">Quantity to {sign > 0 ? 'add' : 'remove'}</Label>
            <Input id="adjust-qty" type="number" min={1} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-note">Note (optional)</Label>
            <Input id="adjust-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. supplier bill no. 214" />
          </div>
          {item && valid && (
            <p className={newStock < 0 ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
              New stock: <strong>{item.stock} → {newStock}</strong>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid || saving || newStock < 0}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
