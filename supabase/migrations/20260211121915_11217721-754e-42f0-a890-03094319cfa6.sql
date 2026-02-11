
-- Add review_requested_at column to leads_access
ALTER TABLE public.leads_access
ADD COLUMN review_requested_at timestamp with time zone DEFAULT NULL;

-- RLS policy: clients can view leads_access for their own quotes
CREATE POLICY "Clients can view leads_access for their quotes"
ON public.leads_access
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = leads_access.quote_id
      AND quotes.client_id = auth.uid()
  )
);
