-- Drop and recreate vendors_public view with security_definer
DROP VIEW IF EXISTS public.vendors_public;
CREATE VIEW public.vendors_public
WITH (security_barrier = true) AS
SELECT 
    id,
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
WHERE is_approved = true 
AND (
    subscription_status = 'active'::subscription_status 
    OR (approved_at IS NOT NULL AND approved_at > now() - interval '24 hours')
);

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- Drop and recreate vendors_search view with security_definer
DROP VIEW IF EXISTS public.vendors_search;
CREATE VIEW public.vendors_search
WITH (security_barrier = true) AS
SELECT 
    v.id,
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
    COALESCE((
        SELECT count(*)::integer 
        FROM coupons c 
        WHERE c.vendor_id = v.id 
        AND c.is_active = true 
        AND c.expires_at > now() 
        AND (c.max_uses IS NULL OR c.current_uses < c.max_uses)
    ), 0)::integer AS active_coupons_count,
    COALESCE((
        SELECT avg(r.rating)::numeric(2,1) 
        FROM reviews r 
        WHERE r.target_id = v.profile_id
    ), 0::numeric) AS avg_rating,
    COALESCE((
        SELECT count(*)::integer 
        FROM reviews r 
        WHERE r.target_id = v.profile_id
    ), 0)::integer AS review_count
FROM vendors v
WHERE v.is_approved = true 
AND (
    v.subscription_status = 'active'::subscription_status 
    OR v.approved_at > now() - interval '24 hours'
);

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.vendors_search TO anon, authenticated;