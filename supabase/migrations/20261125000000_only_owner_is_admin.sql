-- Only hayaatemporium@gmail.com can be an admin. Safe to run more than once.
--
-- Every other account is turned into a normal customer, and the database refuses to give the
-- admin role to any other email from now on, even from the SQL Editor. To change the owner email
-- later, edit the address in both places below and run this file again.

UPDATE public.user_profiles p
SET role = 'customer'
WHERE p.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.user_id AND lower(u.email) = 'hayaatemporium@gmail.com'
  );

CREATE OR REPLACE FUNCTION public.only_owner_can_be_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = NEW.user_id AND lower(u.email) = 'hayaatemporium@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Only hayaatemporium@gmail.com can be an admin' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS only_owner_can_be_admin ON public.user_profiles;
CREATE TRIGGER only_owner_can_be_admin
  BEFORE INSERT OR UPDATE OF role ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.only_owner_can_be_admin();
