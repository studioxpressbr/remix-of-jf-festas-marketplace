-- Create role enum
CREATE TYPE public.app_role AS ENUM ('vendor', 'client');

-- Create category enum
CREATE TYPE public.vendor_category AS ENUM ('confeitaria', 'doces', 'salgados', 'decoracao', 'outros');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'past_due');

-- Create quote status enum
CREATE TYPE public.quote_status AS ENUM ('open', 'unlocked', 'completed', 'cancelled');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  full_name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  category vendor_category NOT NULL DEFAULT 'outros',
  description VARCHAR(300),
  neighborhood TEXT,
  subscription_status subscription_status NOT NULL DEFAULT 'inactive',
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Vendors policies (public can view active vendors)
CREATE POLICY "Active vendors are viewable by everyone"
  ON public.vendors FOR SELECT
  USING (subscription_status = 'active');

CREATE POLICY "Vendors can insert their own data"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Vendors can update their own data"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = profile_id);

-- Quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  pax_count INTEGER NOT NULL,
  description TEXT,
  status quote_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Clients can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Vendors can view quotes sent to them"
  ON public.quotes FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Authenticated clients can create quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = client_id);

-- Leads access table
CREATE TABLE public.leads_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quote_id, vendor_id)
);

-- Enable RLS
ALTER TABLE public.leads_access ENABLE ROW LEVEL SECURITY;

-- Leads access policies
CREATE POLICY "Vendors can view their own lead access"
  ON public.leads_access FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert lead access records"
  ON public.leads_access FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own lead access"
  ON public.leads_access FOR UPDATE
  USING (auth.uid() = vendor_id);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, whatsapp, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for vendor images
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-images', 'vendor-images', true);

-- Storage policies
CREATE POLICY "Anyone can view vendor images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor-images');

CREATE POLICY "Authenticated users can upload vendor images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vendor-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own vendor images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vendor-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own vendor images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vendor-images' AND auth.uid()::text = (storage.foldername(name))[1]);