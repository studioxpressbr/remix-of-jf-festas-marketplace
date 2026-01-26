-- Create admin role enum and user_roles table for admin management
CREATE TYPE public.admin_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role admin_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _role admin_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'admin'));

-- Create categories table for dynamic category management
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  emoji TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  suggested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved categories"
ON public.categories FOR SELECT
USING (is_approved = true);

CREATE POLICY "Authenticated users can suggest categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = suggested_by AND is_approved = false);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.categories (name, slug, emoji, is_approved) VALUES
  ('Confeitaria', 'confeitaria', '🎂', true),
  ('Doces', 'doces', '🍬', true),
  ('Salgados', 'salgados', '🥟', true),
  ('Decoração', 'decoracao', '🎈', true),
  ('Outros', 'outros', '✨', true);

-- Update vendors table with new columns
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id),
ADD COLUMN IF NOT EXISTS custom_category TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true AND expires_at > now());

CREATE POLICY "Vendors can manage their own coupons"
ON public.coupons FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE id = coupons.vendor_id 
    AND profile_id = auth.uid()
  )
);

-- Add event_date to reviews for 7-day window validation
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS event_date DATE;

-- Create terms_acceptance table
CREATE TABLE public.terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  UNIQUE (user_id, terms_version)
);

ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acceptances"
ON public.terms_acceptance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can accept terms"
ON public.terms_acceptance FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update RLS policy for vendors to show only approved profiles
DROP POLICY IF EXISTS "Active vendors are viewable by everyone" ON public.vendors;

CREATE POLICY "Approved active vendors are viewable by everyone"
ON public.vendors FOR SELECT
USING (subscription_status = 'active' AND is_approved = true);

CREATE POLICY "Vendors can view their own profile regardless of status"
ON public.vendors FOR SELECT
USING (auth.uid() = profile_id);