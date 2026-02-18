
-- Add address column to vendors table
ALTER TABLE public.vendors ADD COLUMN address text;

-- Recreate vendors_public view to include address
DROP VIEW IF EXISTS public.vendors_public;
CREATE VIEW public.vendors_public WITH (security_barrier = true, security_invoker = true) AS
SELECT 
  v.id,
  v.profile_id,
  v.category,
  v.category_id,
  v.is_approved,
  v.subscription_status,
  v.created_at,
  v.vendor_type,
  v.business_name,
  v.slug,
  v.custom_category,
  v.description,
  v.neighborhood,
  v.images,
  v.website_url,
  v.instagram_url,
  v.address
FROM public.vendors v
WHERE v.is_approved = true AND v.subscription_status = 'active';

GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- Recreate vendors_search view to include address
DROP VIEW IF EXISTS public.vendors_search;
CREATE VIEW public.vendors_search WITH (security_barrier = true, security_invoker = true) AS
SELECT 
  v.id,
  v.profile_id,
  v.category,
  v.category_id,
  v.is_approved,
  v.created_at,
  v.approved_at,
  v.subscription_status,
  v.vendor_type,
  v.business_name,
  v.slug,
  v.custom_category,
  v.description,
  v.neighborhood,
  v.images,
  v.website_url,
  v.instagram_url,
  v.address,
  COALESCE(r.avg_rating, 0) as avg_rating,
  COALESCE(r.review_count, 0) as review_count,
  COALESCE(c.active_coupons_count, 0) as active_coupons_count
FROM public.vendors v
LEFT JOIN (
  SELECT target_id, AVG(rating)::numeric as avg_rating, COUNT(*)::bigint as review_count
  FROM public.reviews
  GROUP BY target_id
) r ON r.target_id = v.profile_id
LEFT JOIN (
  SELECT vendor_id, COUNT(*)::bigint as active_coupons_count
  FROM public.coupons
  WHERE is_active = true AND expires_at > now()
  GROUP BY vendor_id
) c ON c.vendor_id = v.id
WHERE v.is_approved = true AND v.subscription_status = 'active';

GRANT SELECT ON public.vendors_search TO anon, authenticated;
