import { supabase } from '@/integrations/supabase/client';

export interface CouponValidation {
  valid: boolean;
  discount_amount: number;
  discount_type: string;
  discount_value: number;
  coupon_id: string;
  code: string;
  title?: string | null;
  error?: string;
}

/** A coupon the shop shows openly on the checkout page (admin switched on "Show on website"). */
export interface PublicCoupon {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  minimum_order_amount: number | null;
  expires_at: string | null;
}

class CouponService {
  /**
   * Checks a code for the signed-in customer. Works for public and private coupons; the
   * database applies all rules (dates, limits, members, minimum order) and returns the discount.
   */
  async validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code.trim().toUpperCase(),
      p_subtotal: subtotal,
    });
    if (error) throw new Error(error.message || 'Failed to validate coupon');
    return data as unknown as CouponValidation;
  }

  /** Public, active, currently valid coupons. Private coupons are never returned (database rule). */
  async listPublicCoupons(): Promise<PublicCoupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, title, description, discount_type, discount_value, max_discount_amount, minimum_order_amount, expires_at')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('discount_value', { ascending: false });
    if (error) return [];
    return (data ?? []) as PublicCoupon[];
  }
}

export const couponService = new CouponService();
