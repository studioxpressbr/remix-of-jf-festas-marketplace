-- Add RLS policy for admins to view ALL vendors (including pending ones)
CREATE POLICY "Admins can view all vendors"
ON public.vendors
FOR SELECT
TO authenticated
USING (public.has_admin_role(auth.uid(), 'admin'::admin_role));

-- Add RLS policy for admins to update any vendor (for approval)
CREATE POLICY "Admins can update all vendors"
ON public.vendors
FOR UPDATE
TO authenticated
USING (public.has_admin_role(auth.uid(), 'admin'::admin_role));

-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_admin_role(auth.uid(), 'admin'::admin_role));