-- Home banners (hero slideshow managed from the admin), Trending products, and an "on sale"
-- flag per colour/size (MRP higher than selling price). Safe to run more than once.

-- 1. Trending switch on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products (is_trending) WHERE is_trending;

-- 2. A colour/size is on sale when its MRP (compare_at_price) is higher than its selling price.
--    Kept up to date automatically by the database.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS on_sale boolean
  GENERATED ALWAYS AS (compare_at_price IS NOT NULL AND compare_at_price > price) STORED;
CREATE INDEX IF NOT EXISTS idx_product_variants_on_sale ON public.product_variants (on_sale) WHERE on_sale;

-- 3. Home banners
CREATE TABLE IF NOT EXISTS public.home_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  button_text text,
  image_url text NOT NULL,
  mobile_image_url text,
  link_type text NOT NULL DEFAULT 'none' CHECK (link_type IN ('collection', 'sale', 'url', 'none')),
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active banners viewable by everyone" ON public.home_banners;
CREATE POLICY "Active banners viewable by everyone" ON public.home_banners
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage banners" ON public.home_banners;
CREATE POLICY "Admins manage banners" ON public.home_banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_home_banners_updated_at ON public.home_banners;
CREATE TRIGGER update_home_banners_updated_at
  BEFORE UPDATE ON public.home_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admins may remove banner images they uploaded (the product-images bucket already allows
-- admin uploads; this adds delete for the whole bucket if it was missing).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete product images'
  ) THEN
    CREATE POLICY "Admins can delete product images" ON storage.objects
      FOR DELETE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.user_role));
  END IF;
END $$;
