-- Create vendors_search view with aggregated coupon count and ratings
CREATE OR REPLACE VIEW public.vendors_search AS
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
  COALESCE(
    (SELECT COUNT(*) FROM coupons c 
     WHERE c.vendor_id = v.id 
     AND c.is_active = true 
     AND c.expires_at > NOW()
     AND (c.max_uses IS NULL OR c.current_uses < c.max_uses)
    ), 0
  )::integer AS active_coupons_count,
  COALESCE(
    (SELECT AVG(r.rating)::numeric(2,1) FROM reviews r WHERE r.target_id = v.profile_id), 0
  ) AS avg_rating,
  COALESCE(
    (SELECT COUNT(*) FROM reviews r WHERE r.target_id = v.profile_id), 0
  )::integer AS review_count
FROM vendors v
WHERE v.is_approved = true 
  AND (
    v.subscription_status = 'active' 
    OR v.approved_at > NOW() - INTERVAL '24 hours'
  );