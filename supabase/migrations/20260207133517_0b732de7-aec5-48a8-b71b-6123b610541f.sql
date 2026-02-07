-- Add min_order_value column to coupons table
ALTER TABLE public.coupons
ADD COLUMN min_order_value numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.coupons.min_order_value IS 'Minimum order value required to use this coupon (in BRL)';