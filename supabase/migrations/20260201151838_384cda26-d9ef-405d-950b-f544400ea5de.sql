-- Create a separate admin-only table for sensitive payment transaction data
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leads_access_id UUID NOT NULL REFERENCES public.leads_access(id) ON DELETE CASCADE,
    transaction_id TEXT,
    stripe_session_id TEXT,
    amount_cents INTEGER,
    currency TEXT DEFAULT 'brl',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Only admins can view payment transactions
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
USING (has_admin_role(auth.uid(), 'admin'::admin_role));

-- Only service role (via edge functions) can insert
CREATE POLICY "Service role can insert payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_payment_transactions_leads_access ON public.payment_transactions(leads_access_id);

-- Migrate existing transaction_id data to the new table
INSERT INTO public.payment_transactions (leads_access_id, transaction_id, created_at)
SELECT id, transaction_id, created_at
FROM public.leads_access
WHERE transaction_id IS NOT NULL;

-- Drop the transaction_id column from leads_access to prevent exposure
ALTER TABLE public.leads_access DROP COLUMN transaction_id;