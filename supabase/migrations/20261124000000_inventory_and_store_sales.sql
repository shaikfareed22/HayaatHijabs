-- Inventory management and in-store sales. Safe to run more than once.
--
-- There is ONE stock number per colour/size (product_variants.stock_quantity). The website,
-- online orders, in-store sales, restocks and cancellations all change that same number, and
-- every change is written to stock_movements automatically.

-- ---------------------------------------------------------------------------------------------
-- 1. Numbers-only code for every colour/size (for barcodes and quick search), and no negative stock
-- ---------------------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.variant_code_seq START 100001;
GRANT USAGE, SELECT ON SEQUENCE public.variant_code_seq TO authenticated;

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS item_code text;
UPDATE public.product_variants SET item_code = nextval('public.variant_code_seq')::text WHERE item_code IS NULL;
ALTER TABLE public.product_variants ALTER COLUMN item_code SET DEFAULT (nextval('public.variant_code_seq'::regclass))::text;
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_item_code_key ON public.product_variants (item_code);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_item_code_digits') THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_item_code_digits CHECK (item_code ~ '^[0-9]+$');
  END IF;
  -- NOT VALID: existing rows are left alone, every new change must keep stock at 0 or more.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_stock_not_negative') THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_stock_not_negative CHECK (stock_quantity >= 0) NOT VALID;
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 2. Offline (in-store) customers: name + phone, one row per phone number
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offline_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offline_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage offline customers" ON public.offline_customers;
CREATE POLICY "Admins manage offline customers" ON public.offline_customers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------------------------
-- 3. Orders can be online (website account) or store (walk-in customer, no account)
-- ---------------------------------------------------------------------------------------------
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS offline_customer_id uuid REFERENCES public.offline_customers(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_channel_check') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_channel_check CHECK (channel IN ('online', 'store'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('cash', 'upi', 'card'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_store_sale_details') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_store_sale_details CHECK (
      channel <> 'store' OR (customer_name IS NOT NULL AND customer_phone IS NOT NULL AND payment_method IS NOT NULL)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_channel_created ON public.orders (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_offline_customer ON public.orders (offline_customer_id);

-- ---------------------------------------------------------------------------------------------
-- 4. Stock history: every change to a stock number, who made it and why
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text,
  sku text,
  color text,
  size text,
  change integer NOT NULL,
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  reason text NOT NULL,
  note text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON public.stock_movements (variant_id, created_at DESC);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view stock history" ON public.stock_movements;
CREATE POLICY "Admins view stock history" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- No insert/update/delete policies: rows are only written by the trigger below.

-- Functions that change stock say why with set_config('app.stock_reason', ...) first;
-- anything else (e.g. editing stock on the Products page) is logged as an 'adjustment'.
CREATE OR REPLACE FUNCTION public.log_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text := coalesce(nullif(current_setting('app.stock_reason', true), ''), 'adjustment');
  v_note text := nullif(current_setting('app.stock_note', true), '');
  v_order uuid := nullif(current_setting('app.stock_order_id', true), '')::uuid;
  v_before integer;
  v_after integer := coalesce(NEW.stock_quantity, 0);
  v_product text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF v_after = 0 THEN
      RETURN NEW;
    END IF;
    v_before := 0;
    v_reason := 'opening_stock';
  ELSE
    v_before := coalesce(OLD.stock_quantity, 0);
    IF v_before = v_after THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT name INTO v_product FROM public.products WHERE id = NEW.product_id;

  INSERT INTO public.stock_movements
    (variant_id, product_name, sku, color, size, change, stock_before, stock_after, reason, note, order_id)
  VALUES
    (NEW.id, v_product, NEW.sku, NEW.color, NEW.size, v_after - v_before, v_before, v_after, v_reason, v_note, v_order);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_stock_movement ON public.product_variants;
CREATE TRIGGER log_stock_movement
  AFTER INSERT OR UPDATE OF stock_quantity ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.log_stock_movement();

-- ---------------------------------------------------------------------------------------------
-- 5. Orders reduce stock (online and store), recorded with the right reason
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT channel INTO v_channel FROM public.orders WHERE id = NEW.order_id;
    PERFORM set_config('app.stock_reason', CASE WHEN v_channel = 'store' THEN 'store_sale' ELSE 'online_order' END, true);
    PERFORM set_config('app.stock_order_id', NEW.order_id::text, true);

    UPDATE public.product_variants
    SET stock_quantity = coalesce(stock_quantity, 0) - NEW.quantity
    WHERE id = NEW.variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant not found';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- A cancelled order has already given its stock back.
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = OLD.order_id AND order_status = 'cancelled') THEN
      PERFORM set_config('app.stock_reason', 'order_deleted', true);
      PERFORM set_config('app.stock_order_id', '', true);
      UPDATE public.product_variants
      SET stock_quantity = coalesce(stock_quantity, 0) + OLD.quantity
      WHERE id = OLD.variant_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- 6. Cancelling an order puts its stock back; un-cancelling takes it again
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restock_on_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_status = 'cancelled' AND OLD.order_status IS DISTINCT FROM 'cancelled' THEN
    PERFORM set_config('app.stock_reason', 'order_cancelled', true);
    PERFORM set_config('app.stock_order_id', NEW.id::text, true);
    UPDATE public.product_variants v
    SET stock_quantity = coalesce(v.stock_quantity, 0) + oi.qty
    FROM (SELECT variant_id, sum(quantity) AS qty FROM public.order_items WHERE order_id = NEW.id GROUP BY variant_id) oi
    WHERE v.id = oi.variant_id;
  ELSIF OLD.order_status = 'cancelled' AND NEW.order_status IS DISTINCT FROM 'cancelled' THEN
    PERFORM set_config('app.stock_reason', 'order_restored', true);
    PERFORM set_config('app.stock_order_id', NEW.id::text, true);
    BEGIN
      UPDATE public.product_variants v
      SET stock_quantity = coalesce(v.stock_quantity, 0) - oi.qty
      FROM (SELECT variant_id, sum(quantity) AS qty FROM public.order_items WHERE order_id = NEW.id GROUP BY variant_id) oi
      WHERE v.id = oi.variant_id;
    EXCEPTION WHEN check_violation THEN
      RAISE EXCEPTION 'Not enough stock to restore this order. Restock the items first.';
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restock_on_order_status ON public.orders;
CREATE TRIGGER restock_on_order_status
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restock_on_order_status();

-- ---------------------------------------------------------------------------------------------
-- 7. Restock / correct stock (admin only, always with a reason)
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_stock(p_variant_id uuid, p_change integer, p_reason text, p_note text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change stock' USING ERRCODE = '42501';
  END IF;
  IF p_change IS NULL OR p_change = 0 THEN
    RAISE EXCEPTION 'Enter a quantity other than 0';
  END IF;
  IF p_reason NOT IN ('restock', 'adjustment', 'damaged', 'return') THEN
    RAISE EXCEPTION 'Unknown reason: %', p_reason;
  END IF;

  PERFORM set_config('app.stock_reason', p_reason, true);
  PERFORM set_config('app.stock_note', coalesce(p_note, ''), true);
  PERFORM set_config('app.stock_order_id', '', true);

  BEGIN
    UPDATE public.product_variants
    SET stock_quantity = coalesce(stock_quantity, 0) + p_change
    WHERE id = p_variant_id
    RETURNING stock_quantity INTO v_new;
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'Stock cannot go below 0';
  END;

  IF v_new IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;
  RETURN v_new;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- 8. Record an in-store sale (admin only). Name, phone and payment method are required.
--    Prices come from the database, stock is checked and locked, and the customer is saved
--    (or updated) by phone number.
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_store_sale(
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_phone text := regexp_replace(coalesce(p_customer_phone, ''), '[^0-9+]', '', 'g');
  v_customer uuid;
  v_order uuid;
  v_total numeric := 0;
  v_item record;
  v_variant record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can record sales' USING ERRCODE = '42501';
  END IF;
  IF v_name = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  IF length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Enter a valid phone number (at least 10 digits)';
  END IF;
  IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash', 'upi', 'card') THEN
    RAISE EXCEPTION 'Choose a payment method: Cash, UPI or Card';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Add at least one item';
  END IF;

  -- Check every item (same item listed twice is added up) and lock its stock row.
  FOR v_item IN
    SELECT (e ->> 'variant_id')::uuid AS variant_id, sum((e ->> 'quantity')::integer) AS quantity
    FROM jsonb_array_elements(p_items) AS e
    GROUP BY 1
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity < 1 THEN
      RAISE EXCEPTION 'Each quantity must be 1 or more';
    END IF;

    SELECT v.id, v.price, coalesce(v.stock_quantity, 0) AS stock, v.sku, v.color, v.size, p.name
    INTO v_variant
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = v_item.variant_id
    FOR UPDATE OF v;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'An item in this sale no longer exists';
    END IF;
    IF v_variant.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Only % left of % (%)', v_variant.stock, v_variant.name, v_variant.sku;
    END IF;

    v_total := v_total + v_variant.price * v_item.quantity;
  END LOOP;

  INSERT INTO public.offline_customers (name, phone)
  VALUES (v_name, v_phone)
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
  RETURNING id INTO v_customer;

  INSERT INTO public.orders (
    user_id, channel, customer_name, customer_phone, payment_method, offline_customer_id,
    total_price, order_status, payment_status, shipping_address, shipping_amount, discount_amount
  )
  VALUES (
    NULL, 'store', v_name, v_phone, p_payment_method, v_customer,
    v_total, 'delivered', 'paid',
    jsonb_build_object('name', v_name, 'phone', v_phone, 'address', 'In-store sale'),
    0, 0
  )
  RETURNING id INTO v_order;

  -- Inserting the items reduces stock through update_stock_on_order (reason: store_sale).
  INSERT INTO public.order_items (order_id, product_id, variant_id, quantity, price)
  SELECT v_order, v.product_id, v.id, i.quantity, v.price
  FROM (
    SELECT (e ->> 'variant_id')::uuid AS variant_id, sum((e ->> 'quantity')::integer) AS quantity
    FROM jsonb_array_elements(p_items) AS e
    GROUP BY 1
  ) i
  JOIN public.product_variants v ON v.id = i.variant_id;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_stock(uuid, integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_store_sale(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_store_sale(text, text, text, jsonb) TO authenticated;
