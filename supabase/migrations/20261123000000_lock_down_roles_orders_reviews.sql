-- Security fixes. Safe to run more than once.
--
-- 1. Any signed-in customer could make themselves an admin: the "Users can update their own profile"
--    policy lets them change every column of their profile, including `role`, and admin access
--    (has_role) only looks at that column.
-- 2. Customers could insert orders and order items directly, with any price. Real orders are created
--    by the `orders` edge function with the service key, which does not need these policies.
-- 3. Customers could mark their own reviews as verified.

-- 1. Only admins (or the database itself) may set or change a role.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is null for the signup trigger, the SQL editor and edge functions using the service key.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'customer';
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only an admin can change roles' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.user_profiles;
CREATE TRIGGER protect_profile_role
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 2. Orders only through the edge function (server-side prices and stock checks).
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;

-- 3. Only admins (or server code) can verify a review.
CREATE OR REPLACE FUNCTION public.protect_review_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false;
  ELSE
    NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_review_verification ON public.reviews;
CREATE TRIGGER protect_review_verification
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_verification();
