
DROP POLICY IF EXISTS "Public can read orders by id" ON public.orders;
DROP POLICY IF EXISTS "Public can read tickets" ON public.tickets;
REVOKE SELECT ON public.orders FROM anon, authenticated;
REVOKE SELECT ON public.tickets FROM anon, authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.tickets TO service_role;
