
-- Add proposal columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN proposed_value numeric,
ADD COLUMN proposal_message text,
ADD COLUMN proposed_at timestamptz,
ADD COLUMN contract_url text,
ADD COLUMN client_response text,
ADD COLUMN client_responded_at timestamptz;

-- Add check constraint for client_response values
ALTER TABLE public.quotes
ADD CONSTRAINT quotes_client_response_check CHECK (client_response IN ('accepted', 'rejected'));

-- Add 'proposed' to quote_status enum
ALTER TYPE public.quote_status ADD VALUE IF NOT EXISTS 'proposed' AFTER 'unlocked';

-- Update RLS: Allow vendors to update proposal fields on their quotes
CREATE POLICY "Vendors can update proposal on their quotes"
ON public.quotes
FOR UPDATE
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Create vendor-contracts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-contracts', 'vendor-contracts', true);

-- Storage policies for vendor-contracts
CREATE POLICY "Authenticated users can upload contracts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'vendor-contracts' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view contracts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor-contracts');

CREATE POLICY "Users can update their own contracts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'vendor-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own contracts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'vendor-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);
