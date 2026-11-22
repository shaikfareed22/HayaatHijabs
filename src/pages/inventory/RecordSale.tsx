import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, CreditCard, Minus, Plus, ScanBarcode, Search, Smartphone, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  InventoryItem, PAYMENT_LABEL, PaymentMethod, STOCK_STATUS_CLASS, STOCK_STATUS_LABEL, errorMessage,
  fetchInventoryItems, formatINR, optionLabel, stockStatus,
} from '@/lib/inventory';

interface CartLine {
  item: InventoryItem;
  quantity: number;
}

const PAYMENT_ICONS: Record<PaymentMethod, typeof Banknote> = { cash: Banknote, upi: Smartphone, card: CreditCard };
const digitsOnly = (v: string) => v.replace(/[^0-9]/g, '');

export default function RecordSale() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; total: number; name: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchInventoryItems());
    } catch (e) {
      toast({ title: 'Could not load products', description: errorMessage(e), variant: 'destructive' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const exact = (i: InventoryItem) => i.itemCode === q || i.sku.toLowerCase() === q;
    return items
      .filter((i) => [i.itemCode, i.sku, i.productName, i.color, i.size ?? ''].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => Number(exact(b)) - Number(exact(a)))
      .slice(0, 12);
  }, [items, query]);

  const inCart = (id: string) => cart.find((l) => l.item.id === id)?.quantity ?? 0;

  const addToCart = (item: InventoryItem) => {
    if (inCart(item.id) >= item.stock) {
      toast({ title: 'Not enough stock', description: `Only ${item.stock} of ${item.productName} (${optionLabel(item)}) left.`, variant: 'destructive' });
      return;
    }
    setCart((c) =>
      c.some((l) => l.item.id === item.id)
        ? c.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...c, { item, quantity: 1 }],
    );
    setQuery('');
    setLastSale(null);
    searchRef.current?.focus();
  };

  const setQuantity = (id: string, quantity: number) =>
    setCart((c) => c.map((l) => (l.item.id === id ? { ...l, quantity: Math.max(1, Math.min(quantity, l.item.stock)) } : l)));

  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.item.id !== id));

  // A barcode scanner types the code and presses Enter: add the exact match straight away.
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = query.trim().toLowerCase();
    const exact = items.find((i) => i.itemCode === q || i.sku.toLowerCase() === q);
    if (exact) addToCart(exact);
    else if (matches.length === 1) addToCart(matches[0]);
  };

  const total = cart.reduce((sum, l) => sum + l.item.price * l.quantity, 0);
  const units = cart.reduce((sum, l) => sum + l.quantity, 0);
  const nameOk = name.trim().length > 0;
  const phoneOk = digitsOnly(phone).length >= 10;
  const canCheckout = cart.length > 0 && nameOk && phoneOk && payment !== null && !saving;

  const checkout = async () => {
    if (!canCheckout || !payment) return;
    setSaving(true);
    const { data, error } = await supabase.rpc('record_store_sale', {
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_payment_method: payment,
      p_items: cart.map((l) => ({ variant_id: l.item.id, quantity: l.quantity })),
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Sale not saved', description: errorMessage(error), variant: 'destructive' });
      load(); // stock may have changed in the meantime
      return;
    }
    setLastSale({ id: String(data), total, name: name.trim() });
    toast({ title: 'Sale recorded', description: `${units} item${units === 1 ? '' : 's'} · ${formatINR(total)} · ${PAYMENT_LABEL[payment]}` });
    setCart([]);
    setName('');
    setPhone('');
    setPayment(null);
    load();
    searchRef.current?.focus();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-luxury font-semibold">Record Sale</h1>
        <p className="text-muted-foreground text-sm mt-1">
          In-store or phone sales. Stock goes down straight away, on the website too.
        </p>
      </div>

      {lastSale && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>
            Sale saved for <strong>{lastSale.name}</strong>: {formatINR(lastSale.total)} · order #{lastSale.id.slice(-10).toUpperCase()}.
            It's in Store Admin → Orders, and the customer is in Customers.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKey}
                  placeholder="Scan barcode or type code, SKU, product name, colour…"
                  className="pl-10 h-12 text-base"
                />
              </div>
              {query.trim() && (
                <div className="rounded-lg border divide-y max-h-80 overflow-y-auto">
                  {matches.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">Nothing matches “{query.trim()}”.</p>
                  ) : (
                    matches.map((i) => {
                      const s = stockStatus(i.stock, i.lowThreshold);
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => addToCart(i)}
                          disabled={i.stock <= 0}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="font-mono text-xs font-semibold bg-muted rounded px-2 py-1">{i.itemCode}</span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium truncate">{i.productName}</span>
                            <span className="block text-xs text-muted-foreground">{optionLabel(i)} · {i.sku}</span>
                          </span>
                          <span className="text-sm tabular-nums">{formatINR(i.price)}</span>
                          <Badge variant="outline" className={STOCK_STATUS_CLASS[s]}>{i.stock > 0 ? `${i.stock} left` : STOCK_STATUS_LABEL[s]}</Badge>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Items in this sale</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Scan or search above to add items.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{optionLabel(item)} · code {item.itemCode} · {formatINR(item.price)} each · {item.stock} in stock</p>
                      </div>
                      <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, quantity - 1)} disabled={quantity <= 1}><Minus className="w-4 h-4" /></Button>
                        <Input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={quantity}
                          onChange={(e) => setQuantity(item.id, Number(e.target.value) || 1)}
                          className="h-8 w-14 border-0 text-center tabular-nums"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, quantity + 1)} disabled={quantity >= item.stock}><Plus className="w-4 h-4" /></Button>
                      </div>
                      <span className="w-24 text-right font-semibold tabular-nums">{formatINR(item.price * quantity)}</span>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeLine(item.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer + payment */}
        <Card className="h-fit lg:sticky lg:top-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Customer & payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Customer name *</Label>
              <Input id="cust-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone number *</Label>
              <Input id="cust-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" autoComplete="off" />
              {phone && !phoneOk && <p className="text-xs text-destructive">Enter at least 10 digits.</p>}
            </div>
            <div className="space-y-2">
              <Label>Payment method *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => {
                  const Icon = PAYMENT_ICONS[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayment(m)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm font-medium transition-colors',
                        payment === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted/50',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {PAYMENT_LABEL[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Items</span><span className="tabular-nums">{units}</span></div>
              <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="tabular-nums">{formatINR(total)}</span></div>
            </div>

            <Button className="w-full h-11" onClick={checkout} disabled={!canCheckout}>
              {saving ? 'Saving…' : `Checkout · ${formatINR(total)}`}
            </Button>
            {!canCheckout && !saving && (
              <p className="text-xs text-muted-foreground text-center">
                {cart.length === 0
                  ? 'Add at least one item.'
                  : !nameOk || !phoneOk
                    ? 'Customer name and phone number are required.'
                    : 'Choose how the customer paid.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
