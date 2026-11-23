import { useEffect, useState } from 'react';
import { BadgePercent, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { couponService, type PublicCoupon } from '@/services/couponService';

// Public coupons listed under the coupon box at checkout, with their terms. Private coupons
// never appear here, but still work when the customer types the code.

const discountText = (c: PublicCoupon) =>
  c.discount_type === 'percentage'
    ? `${c.discount_value}% off${c.max_discount_amount ? ` (up to ₹${c.max_discount_amount})` : ''}`
    : `₹${c.discount_value} off`;

export function AvailableOffers({ subtotal, applying, onApply }: { subtotal: number; applying: boolean; onApply: (code: string) => void }) {
  const [offers, setOffers] = useState<PublicCoupon[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    couponService.listPublicCoupons().then(setOffers);
  }, []);

  if (offers.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <BadgePercent className="w-3.5 h-3.5" /> Available offers
      </p>
      <ul className="space-y-2">
        {offers.map((c) => {
          const min = Number(c.minimum_order_amount ?? 0);
          const short = min > subtotal ? min - subtotal : 0;
          const expanded = open === c.id;
          return (
            <li key={c.id} className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold tracking-wide">{c.code}</span>
                    <span className="text-foreground">{c.title || discountText(c)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {discountText(c)}
                    {min > 0 && ` · Min order ₹${min}`}
                    {c.expires_at && ` · Valid till ${new Date(c.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                  {short > 0 && <p className="text-xs text-amber-700 mt-0.5">Add ₹{short.toFixed(0)} more to use this offer</p>}
                </div>
                <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" disabled={applying || short > 0} onClick={() => onApply(c.code)}>
                  Apply
                </Button>
              </div>
              {c.description && (
                <div className="mt-2">
                  <button type="button" onClick={() => setOpen(expanded ? null : c.id)} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Terms & conditions {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {expanded && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{c.description}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
