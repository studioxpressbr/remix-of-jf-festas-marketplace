-- Add rejection_reason column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN rejection_reason text DEFAULT NULL;