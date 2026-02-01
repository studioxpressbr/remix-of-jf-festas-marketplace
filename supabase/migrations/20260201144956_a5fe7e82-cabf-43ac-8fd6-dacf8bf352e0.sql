-- Create a public view for vendors that excludes sensitive fields
CREATE VIEW public.vendors_public
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
  FROM public.vendors
  WHERE is_approved = true AND subscription_status = 'active';
-- Excludes: stripe_customer_id, approved_by, approved_at, submitted_at, subscription_expiry

-- Drop the old public SELECT policy
DROP POLICY IF EXISTS "Approved active vendors are viewable by everyone" ON public.vendors;

-- Create a new restrictive policy for authenticated users only for the base table
-- Public access will be through the view only
CREATE POLICY "Approved active vendors viewable by authenticated users"
ON public.vendors
FOR SELECT
TO authenticated
USING (
  (subscription_status = 'active' AND is_approved = true)
  OR auth.uid() = profile_id
  OR has_admin_role(auth.uid(), 'admin')
);