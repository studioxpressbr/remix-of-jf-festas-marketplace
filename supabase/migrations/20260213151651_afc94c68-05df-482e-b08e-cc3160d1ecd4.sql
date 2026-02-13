
-- Add instagram_url column to vendors table (if not already added)
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Update vendors_public view to include instagram_url
DROP VIEW IF EXISTS public.vendors_public CASCADE;
CREATE VIEW public.vendors_public AS
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
    v.instagram_url
  FROM vendors v
  WHERE v.is_approved = true;

-- Update vendors_search view to include instagram_url and website_url
DROP VIEW IF EXISTS public.vendors_search CASCADE;
CREATE VIEW public.vendors_search AS
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
    ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1) as avg_rating,
    COUNT(r.id)::bigint as review_count,
    COUNT(CASE WHEN c.is_active = true AND c.expires_at > now() THEN 1 END)::bigint as active_coupons_count
  FROM vendors v
  LEFT JOIN reviews r ON r.target_id = v.profile_id
  LEFT JOIN coupons c ON c.vendor_id = v.id
  WHERE v.is_approved = true AND v.subscription_status = 'active'
  GROUP BY v.id;
