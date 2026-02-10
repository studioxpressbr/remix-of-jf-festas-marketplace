CREATE POLICY "Admins can view all leads_access"
ON public.leads_access
FOR SELECT
USING (has_admin_role(auth.uid(), 'admin'::admin_role));