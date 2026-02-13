-- Habilitar extensão unaccent
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;

-- Corrigir função para usar public.unaccent explicitamente
CREATE OR REPLACE FUNCTION public.generate_slug(text) 
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          public.unaccent($1),
          '[^a-z0-9\s-]', '', 'gi'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Corrigir search_path do trigger
CREATE OR REPLACE FUNCTION public.handle_vendor_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := public.generate_slug(NEW.business_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;