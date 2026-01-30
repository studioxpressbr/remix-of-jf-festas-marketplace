-- Create table for vendor credit balance and transaction history
CREATE TABLE public.vendor_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for credit, negative for debit
  balance_after INTEGER NOT NULL, -- running balance after this transaction
  transaction_type TEXT NOT NULL, -- 'purchase', 'lead_unlock', 'refund', 'bonus'
  description TEXT,
  quote_id UUID REFERENCES public.quotes(id), -- if related to a lead unlock
  stripe_session_id TEXT, -- if related to a Stripe payment
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_vendor_credits_vendor_id ON public.vendor_credits(vendor_id);
CREATE INDEX idx_vendor_credits_created_at ON public.vendor_credits(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.vendor_credits ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own credit history
CREATE POLICY "Vendors can view their own credits"
ON public.vendor_credits
FOR SELECT
USING (auth.uid() = vendor_id);

-- Service role (edge functions) can insert credits
CREATE POLICY "Service role can insert credits"
ON public.vendor_credits
FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
ON public.vendor_credits
FOR SELECT
USING (has_admin_role(auth.uid(), 'admin'::admin_role));

-- Create a function to get current balance for a vendor
CREATE OR REPLACE FUNCTION public.get_vendor_balance(p_vendor_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT balance_after 
     FROM public.vendor_credits 
     WHERE vendor_id = p_vendor_id 
     ORDER BY created_at DESC 
     LIMIT 1),
    0
  );
$$;