
-- 1. Conceder SELECT nas views
GRANT SELECT ON public.vendors_search TO anon, authenticated;
GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- 2. Remover politica restritiva antiga
DROP POLICY IF EXISTS "Approved active vendors viewable by authenticated users" ON public.vendors;

-- 3. Criar politica permissiva (permite anon + authenticated)
CREATE POLICY "Public can view approved active vendors"
  ON public.vendors
  FOR SELECT
  TO anon, authenticated
  USING (
    subscription_status = 'active'::subscription_status
    AND is_approved = true
  );
