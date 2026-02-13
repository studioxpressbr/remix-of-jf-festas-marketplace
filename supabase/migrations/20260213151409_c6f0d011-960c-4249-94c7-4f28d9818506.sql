
-- Create enum for vendor type
CREATE TYPE vendor_type AS ENUM ('mei', 'empresarial');

-- Add new columns to vendors table
ALTER TABLE vendors ADD COLUMN vendor_type vendor_type NOT NULL DEFAULT 'mei';
ALTER TABLE vendors ADD COLUMN website_url TEXT;

-- Update vendors_public view to include new columns
DROP VIEW IF EXISTS vendors_public CASCADE;
CREATE VIEW vendors_public AS
SELECT 
  v.id,
  v.profile_id,
  v.category,
  v.category_id,
  v.is_approved,
  v.subscription_status,
  v.created_at,
  v.business_name,
  v.slug,
  v.custom_category,
  v.description,
  v.neighborhood,
  v.images,
  v.vendor_type,
  v.website_url
FROM vendors v
WHERE v.is_approved = true AND v.subscription_status = 'active'::subscription_status;

-- Update vendors_search view to include new columns and additional metrics
DROP VIEW IF EXISTS vendors_search CASCADE;
CREATE VIEW vendors_search AS
SELECT 
  v.id,
  v.profile_id,
  v.category,
  v.category_id,
  v.is_approved,
  v.created_at,
  v.approved_at,
  v.subscription_status,
  v.business_name,
  v.slug,
  v.custom_category,
  v.description,
  v.neighborhood,
  v.images,
  v.vendor_type,
  v.website_url,
  ROUND(AVG(COALESCE(r.rating, 0))::numeric, 1) as avg_rating,
  COUNT(DISTINCT r.id) as review_count,
  COUNT(DISTINCT CASE WHEN c.is_active = true AND c.expires_at > now() THEN c.id END) as active_coupons_count
FROM vendors v
LEFT JOIN reviews r ON r.target_id = v.profile_id
LEFT JOIN coupons c ON c.vendor_id = v.id
WHERE v.is_approved = true AND v.subscription_status = 'active'::subscription_status
GROUP BY v.id, v.profile_id, v.category, v.category_id, v.is_approved, v.created_at, v.approved_at, v.subscription_status, v.business_name, v.slug, v.custom_category, v.description, v.neighborhood, v.images, v.vendor_type, v.website_url;

-- Grant permissions on views for public access
GRANT SELECT ON vendors_public TO anon, authenticated;
GRANT SELECT ON vendors_search TO anon, authenticated;
