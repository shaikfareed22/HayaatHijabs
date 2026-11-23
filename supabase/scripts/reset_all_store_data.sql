-- ============================================================================================
-- START FRESH: permanently deletes ALL store data. This CANNOT be undone.
--
-- Deletes: products, colours/sizes, product image records, stock history, collections,
--          categories, coupons, all orders and in-store sales, carts, wishlists, reviews,
--          payments, offline customers, and every login account except hayaatemporium@gmail.com.
-- Keeps:   the hayaatemporium@gmail.com account (made the only admin), and the database
--          structure, rules and settings.
-- Resets:  number codes start again from 100001.
--
-- Run this ONCE in Supabase > SQL Editor, after downloading a backup.
-- Not a migration on purpose: it lives in supabase/scripts so it never runs automatically.
-- ============================================================================================

BEGIN;

-- Stop if the owner account doesn't exist yet, so you can never lock yourself out.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'hayaatemporium@gmail.com') THEN
    RAISE EXCEPTION 'hayaatemporium@gmail.com has no account yet. Sign up or sign in with it first, then run this again. Nothing was deleted.';
  END IF;
END $$;

-- 1. Products, stock, orders, sales, customers' shop data, shop structure.
--    TRUNCATE empties the tables in one go (stock triggers don't fire, so no history is written).
TRUNCATE TABLE
  public.stock_movements,
  public.payments,
  public.order_items,
  public.orders,
  public.cart_items,
  public.wishlists,
  public.reviews,
  public.product_images,
  public.product_collections,
  public.product_variants,
  public.products,
  public.offline_customers,
  public.coupons,
  public.collections,
  public.categories
RESTART IDENTITY CASCADE;

-- 2. Number codes start again from 100001.
ALTER SEQUENCE IF EXISTS public.variant_code_seq RESTART WITH 100001;

-- 3. Every login account except the owner (their profiles go first).
DELETE FROM public.user_profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.user_id AND lower(u.email) = 'hayaatemporium@gmail.com'
);
DELETE FROM auth.users WHERE lower(email) <> 'hayaatemporium@gmail.com';

-- 4. Make sure the owner has a profile and is the admin.
INSERT INTO public.user_profiles (user_id, email, role)
SELECT u.id, u.email, 'admin'
FROM auth.users u
WHERE lower(u.email) = 'hayaatemporium@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = u.id);

UPDATE public.user_profiles p
SET role = 'admin'
FROM auth.users u
WHERE u.id = p.user_id AND lower(u.email) = 'hayaatemporium@gmail.com';

COMMIT;

-- Check (shows what is left: should be 0 everywhere and 1 account):
SELECT
  (SELECT count(*) FROM public.products) AS products,
  (SELECT count(*) FROM public.product_variants) AS colours_sizes,
  (SELECT count(*) FROM public.orders) AS orders,
  (SELECT count(*) FROM public.offline_customers) AS offline_customers,
  (SELECT count(*) FROM public.categories) AS categories,
  (SELECT count(*) FROM auth.users) AS accounts,
  (SELECT string_agg(email || ' (' || role || ')', ', ') FROM public.user_profiles) AS remaining_account;
