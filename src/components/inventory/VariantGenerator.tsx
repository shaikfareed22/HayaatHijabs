import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { baseSku, buildCombinations, guessSupplierAndDesign } from '@/lib/sku';
import { errorMessage, formatINR } from '@/lib/inventory';

const COLOR_SUGGESTIONS = ['Pink', 'Purple', 'Slate', 'Black', 'White', 'Maroon', 'Navy Blue', 'Beige', 'Olive Green', 'Mustard'];
const SIZE_SUGGESTIONS = ['S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size'];

interface ExistingVariant {
  color: string;
  size: string | null;
  sku: string;
}

interface Props {
  product: { id: string; name: string; product_variants: ExistingVariant[] } | null;
  onClose: () => void;
  onSaved: () => void;
}

const key = (color: string, size: string | null) => `${color.trim().toLowerCase()}|${(size ?? '').trim().toLowerCase()}`;

/** Type colours and sizes once; every combination is created with its own SKU (UC-001-PNK-M) and number code. */
export function VariantGenerator({ product, onClose, onSaved }: Props) {
  const [supplier, setSupplier] = useState('');
  const [design, setDesign] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [openingStock, setOpeningStock] = useState('0');
  const [lowStock, setLowStock] = useState('2');
  const [stockOverrides, setStockOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    const guess = guessSupplierAndDesign(product.product_variants.map((v) => v.sku));
    setSupplier(guess.supplier);
    setDesign(guess.design);
    setColors([]);
    setSizes([]);
    setPrice('');
    setComparePrice('');
    setCostPrice('');
    setOpeningStock('0');
    setLowStock('2');
    setStockOverrides({});
  }, [product]);

  const base = baseSku(supplier, design);
  const existing = useMemo(() => new Set((product?.product_variants ?? []).map((v) => key(v.color, v.size))), [product]);
  const existingSkus = useMemo(() => new Set((product?.product_variants ?? []).map((v) => v.sku.toUpperCase())), [product]);
  const combos = useMemo(() => (base && colors.length ? buildCombinations(base, colors, sizes) : []), [base, colors, sizes]);
  const toCreate = combos.filter((c) => !existing.has(key(c.color, c.size)) && !existingSkus.has(c.sku));

  const priceNum = Number(price);
  const valid = !!base && colors.length > 0 && toCreate.length > 0 && price !== '' && priceNum > 0;
  const stockFor = (sku: string) => stockOverrides[sku] ?? openingStock;

  const save = async () => {
    if (!product || !valid) return;
    setSaving(true);
    const rows = toCreate.map((c) => ({
      product_id: product.id,
      color: c.color,
      size: c.size,
      sku: c.sku,
      price: priceNum,
      compare_at_price: comparePrice ? Number(comparePrice) : null,
      cost_price: costPrice ? Number(costPrice) : null,
      stock_quantity: Math.max(0, Math.floor(Number(stockFor(c.sku)) || 0)),
      low_stock_threshold: Math.max(0, Math.floor(Number(lowStock) || 0)),
      is_active: true,
    }));
    const { error } = await supabase.from('product_variants').insert(rows);
    setSaving(false);
    if (error) {
      const duplicate = error.code === '23505';
      toast({
        title: 'Colours & sizes not added',
        description: duplicate ? 'One of these SKUs is already used by another product. Change the supplier or design code.' : errorMessage(error),
        variant: 'destructive',
      });
      return;
    }
    toast({ title: `${rows.length} item${rows.length === 1 ? '' : 's'} added`, description: `${product.name}: ${rows[0].sku}${rows.length > 1 ? ` … ${rows[rows.length - 1].sku}` : ''}` });
    onClose();
    onSaved();
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-luxury">Add colours & sizes</DialogTitle>
          <DialogDescription>
            {product?.name}: every colour × size gets its own SKU and number code. Existing combinations are skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gen-supplier">Supplier code *</Label>
              <Input id="gen-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value.toUpperCase())} placeholder="e.g. UC" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-design">Design code *</Label>
              <Input id="gen-design" value={design} onChange={(e) => setDesign(e.target.value)} placeholder="e.g. 1" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU starts with</Label>
              <div className="h-10 flex items-center rounded-md border bg-muted/40 px-3 font-mono text-sm">{base || '—'}</div>
            </div>
          </div>

          <TagField label="Colours *" values={colors} onChange={setColors} suggestions={COLOR_SUGGESTIONS} placeholder="Type a colour and press Enter" />
          <TagField label="Sizes" values={sizes} onChange={setSizes} suggestions={SIZE_SUGGESTIONS} placeholder="Type a size and press Enter (leave empty if no sizes)" />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gen-price">Selling price ₹ *</Label>
              <Input id="gen-price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-mrp">MRP ₹</Label>
              <Input id="gen-mrp" type="number" min={0} step="0.01" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-cost">Purchase cost ₹</Label>
              <Input id="gen-cost" type="number" min={0} step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-stock">Opening stock each</Label>
              <Input id="gen-stock" type="number" min={0} step={1} value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-low">Low stock at</Label>
              <Input id="gen-low" type="number" min={0} step={1} value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {combos.length === 0
                ? 'Enter supplier code, design code and at least one colour to see the list.'
                : `${toCreate.length} new item${toCreate.length === 1 ? '' : 's'} will be added${combos.length > toCreate.length ? ` (${combos.length - toCreate.length} already exist)` : ''} — ${colors.length} colour${colors.length === 1 ? '' : 's'} × ${Math.max(sizes.length, 1)} size${sizes.length === 1 ? '' : 's'}`}
            </p>
            {combos.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground sticky top-0">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">SKU</th>
                      <th className="text-left font-medium px-3 py-2">Colour</th>
                      <th className="text-left font-medium px-3 py-2">Size</th>
                      <th className="text-right font-medium px-3 py-2">Price</th>
                      <th className="text-right font-medium px-3 py-2">Opening stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {combos.map((c) => {
                      const skip = !toCreate.includes(c);
                      return (
                        <tr key={c.sku} className={skip ? 'opacity-50' : ''}>
                          <td className="px-3 py-1.5 font-mono">{c.sku}</td>
                          <td className="px-3 py-1.5">{c.color}</td>
                          <td className="px-3 py-1.5">{c.size ?? '—'}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{price ? formatINR(priceNum) : '—'}</td>
                          <td className="px-3 py-1.5 text-right">
                            {skip ? (
                              <span className="text-xs text-muted-foreground">already exists</span>
                            ) : (
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                value={stockFor(c.sku)}
                                onChange={(e) => setStockOverrides((o) => ({ ...o, [c.sku]: e.target.value }))}
                                className="h-8 w-20 ml-auto text-right"
                                aria-label={`Opening stock for ${c.sku}`}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid || saving}>
            {saving ? 'Adding…' : `Add ${toCreate.length || ''} item${toCreate.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagField({ label, values, onChange, suggestions, placeholder }: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  placeholder: string;
}) {
  const [text, setText] = useState('');
  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());

  const add = (raw: string) => {
    const fresh: string[] = [];
    for (const part of raw.split(',')) {
      const v = part.trim();
      if (v && !has(v) && !fresh.some((f) => f.toLowerCase() === v.toLowerCase())) fresh.push(v);
    }
    if (fresh.length) onChange([...values, ...fresh]);
    setText('');
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-sm font-medium">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="rounded-full hover:bg-primary/20 p-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(text);
            } else if (e.key === 'Backspace' && !text && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => add(text)}
          placeholder={values.length ? '' : placeholder}
          className="flex-1 min-w-[160px] bg-transparent py-1 text-sm outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.filter((s) => !has(s)).map((s) => (
          <button key={s} type="button" onClick={() => onChange([...values, s])} className="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}
