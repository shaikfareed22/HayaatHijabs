-- Coupons: public (shown on the website with terms) or private (works only when typed,
-- optionally only for chosen customers), plus rules and limits. Safe to run more than once.

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS title text,                       -- shown to customers, e.g. "Festive 20% off"
  ADD COLUMN IF NOT EXISTS description text,                 -- terms & conditions shown on the website
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_discount_amount numeric,      -- cap for percentage coupons
  ADD COLUMN IF NOT EXISTS per_customer_limit integer,       -- how many times one customer may use it
  ADD COLUMN IF NOT EXISTS allowed_emails text[];            -- private coupons: only these customers

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_per_customer_limit_check') THEN
    ALTER TABLE public.coupons ADD CONSTRAINT coupons_per_customer_limit_check
      CHECK (per_customer_limit IS NULL OR per_customer_limit > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_discount_type_check') THEN
    ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check
      CHECK (discount_type IN ('percentage', 'fixed'));
  END IF;
END $$;

-- Before: every logged-in customer could read ALL active coupons (including private codes).
-- Now: only public, active, currently valid coupons are readable; private ones never are
-- (they are checked by validate_coupon below). Admins keep full access via "Admins manage coupons".
DROP POLICY IF EXISTS "Active coupons viewable by authenticated" ON public.coupons;
DROP POLICY IF EXISTS "Public coupons viewable by everyone" ON public.coupons;
CREATE POLICY "Public coupons viewable by everyone" ON public.coupons
  FOR SELECT TO anon, authenticated
  USING (
    is_public
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR coalesce(used_count, 0) < usage_limit)
  );

-- Checks a code for the signed-in customer and returns the discount. Raises a plain-English
-- error when the coupon can't be used. Used by the website (Apply button) and by the orders
-- function when the order is placed, so the same rules apply in both places.
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  v_email text := lower(coalesce(auth.email(), ''));
  v_used integer;
  v_discount numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in to use a coupon';
  END IF;
  IF p_subtotal IS NULL OR p_subtotal <= 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  SELECT * INTO c FROM public.coupons WHERE code = upper(btrim(coalesce(p_code, ''))) AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon code';
  END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN
    RAISE EXCEPTION 'This coupon is not active yet';
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at <= now() THEN
    RAISE EXCEPTION 'This coupon has expired';
  END IF;
  IF c.usage_limit IS NOT NULL AND coalesce(c.used_count, 0) >= c.usage_limit THEN
    RAISE EXCEPTION 'This coupon has been fully used';
  END IF;
  IF c.allowed_emails IS NOT NULL AND cardinality(c.allowed_emails) > 0
     AND NOT (v_email = ANY (SELECT lower(btrim(e)) FROM unnest(c.allowed_emails) AS e)) THEN
    RAISE EXCEPTION 'This coupon is only for selected customers';
  END IF;
  IF c.per_customer_limit IS NOT NULL THEN
    SELECT count(*) INTO v_used
    FROM public.orders
    WHERE coupon_id = c.id AND user_id = auth.uid() AND order_status IS DISTINCT FROM 'cancelled';
    IF v_used >= c.per_customer_limit THEN
      RAISE EXCEPTION 'You have already used this coupon';
    END IF;
  END IF;
  IF c.minimum_order_amount IS NOT NULL AND p_subtotal < c.minimum_order_amount THEN
    RAISE EXCEPTION 'Minimum order amount for this coupon is ₹%', c.minimum_order_amount;
  END IF;

  IF c.discount_type = 'percentage' THEN
    v_discount := round(p_subtotal * c.discount_value / 100, 2);
    IF c.max_discount_amount IS NOT NULL THEN
      v_discount := least(v_discount, c.max_discount_amount);
    END IF;
  ELSE
    v_discount := least(c.discount_value, p_subtotal);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', c.id,
    'code', c.code,
    'title', c.title,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'discount_amount', v_discount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
