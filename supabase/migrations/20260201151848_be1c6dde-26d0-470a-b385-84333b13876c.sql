-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert payment transactions" ON public.payment_transactions;

-- No INSERT policy for regular users - only service role with service_role_key can insert
-- RLS is bypassed when using service role, so no explicit INSERT policy is needed
-- This ensures only edge functions with service role can create payment transaction records