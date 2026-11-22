-- Admins can see every product and colour/size, including inactive ones. Safe to run more than once.
--
-- Before this, products and variants were only visible while active (correct for customers, but
-- it applied to admins too). So an admin could not mark a product inactive (the database refused
-- with 403 because the result would be invisible), and inactive products vanished from the admin.

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all variants" ON public.product_variants;
CREATE POLICY "Admins can view all variants" ON public.product_variants
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
