-- Add deal tracking columns to leads_access
ALTER TABLE public.leads_access 
ADD COLUMN IF NOT EXISTS deal_closed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deal_value numeric(10,2),
ADD COLUMN IF NOT EXISTS deal_closed_at timestamp with time zone;