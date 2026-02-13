
-- =============================================
-- ETAPA 1: SEGURANÇA - Views e Políticas RLS
-- =============================================

-- 1. Recriar vendors_public como SECURITY INVOKER
DROP VIEW IF EXISTS public.vendors_public;
CREATE VIEW public.vendors_public
WITH (security_barrier = true, security_invoker = true)
AS
SELECT id,
    profile_id,
    business_name,
    category,
    category_id,
    custom_category,
    description,
    neighborhood,
    images,
    is_approved,
    subscription_status,
    created_at
FROM vendors
WHERE ((is_approved = true) AND ((subscription_status = 'active'::subscription_status) OR ((approved_at IS NOT NULL) AND (approved_at > (now() - '24:00:00'::interval)))));

GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- 2. Recriar vendors_search como SECURITY INVOKER
DROP VIEW IF EXISTS public.vendors_search;
CREATE VIEW public.vendors_search
WITH (security_barrier = true, security_invoker = true)
AS
SELECT v.id,
    v.profile_id,
    v.business_name,
    v.category,
    v.custom_category,
    v.description,
    v.neighborhood,
    v.images,
    v.created_at,
    v.subscription_status,
    v.is_approved,
    v.approved_at,
    v.category_id,
    COALESCE(( SELECT (count(*))::integer AS count
           FROM coupons c
          WHERE ((c.vendor_id = v.id) AND (c.is_active = true) AND (c.expires_at > now()) AND ((c.max_uses IS NULL) OR (c.current_uses < c.max_uses)))), 0) AS active_coupons_count,
    COALESCE(( SELECT (avg(r.rating))::numeric(2,1) AS avg
           FROM reviews r
          WHERE (r.target_id = v.profile_id)), (0)::numeric) AS avg_rating,
    COALESCE(( SELECT (count(*))::integer AS count
           FROM reviews r
          WHERE (r.target_id = v.profile_id)), 0) AS review_count
FROM vendors v
WHERE ((v.is_approved = true) AND ((v.subscription_status = 'active'::subscription_status) OR (v.approved_at > (now() - '24:00:00'::interval))));

GRANT SELECT ON public.vendors_search TO anon, authenticated;

-- 3. Restringir reviews para usuários autenticados
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by authenticated users"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- 4. Restringir cupons ativos para usuários autenticados
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING ((is_active = true) AND (expires_at > now()));
