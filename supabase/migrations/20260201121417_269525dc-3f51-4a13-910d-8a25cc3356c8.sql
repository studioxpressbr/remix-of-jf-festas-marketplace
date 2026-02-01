-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Add policy for users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Add policy for vendors to view profiles of clients who sent them quotes
CREATE POLICY "Vendors can view client profiles for their quotes"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.client_id = profiles.id
    AND quotes.vendor_id = auth.uid()
  )
);

-- Add policy for clients to view vendor profiles (for vendors they're interacting with)
CREATE POLICY "Clients can view vendor profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.profile_id = profiles.id
    AND vendors.is_approved = true
    AND vendors.subscription_status = 'active'
  )
);