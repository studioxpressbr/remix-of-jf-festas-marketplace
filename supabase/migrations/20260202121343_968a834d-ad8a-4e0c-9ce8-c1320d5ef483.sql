-- Update the vendors_public view to include approved vendors within 24h grace period
-- even if they haven't subscribed yet (subscription_status = 'inactive')

CREATE OR REPLACE VIEW public.vendors_public
WITH (security_invoker=on) AS
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
WHERE 
  is_approved = true 
  AND (
    -- Active subscribers
    subscription_status = 'active'::subscription_status
    OR
    -- Approved within last 24 hours (grace period for payment)
    (approved_at IS NOT NULL AND approved_at > NOW() - INTERVAL '24 hours')
  );