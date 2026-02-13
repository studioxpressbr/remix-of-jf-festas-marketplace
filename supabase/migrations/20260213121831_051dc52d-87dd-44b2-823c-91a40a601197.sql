-- =============================================
-- ETAPA 2: Slug de Fornecedores
-- =============================================

-- 1. Adicionar coluna slug à tabela vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Criar índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug) WHERE slug IS NOT NULL;

-- 3. Criar função para gerar slug a partir do business_name
CREATE OR REPLACE FUNCTION public.generate_slug(text) 
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          -- Remove acentos
          UNACCENT($1),
          '[^a-z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Gerar trigger para atualizar slug automaticamente
CREATE OR REPLACE FUNCTION public.handle_vendor_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := public.generate_slug(NEW.business_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_slug ON public.vendors;
CREATE TRIGGER trigger_vendor_slug
BEFORE INSERT OR UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.handle_vendor_slug();

-- 5. Recriar vendors_public com slug
DROP VIEW IF EXISTS public.vendors_public;
CREATE VIEW public.vendors_public
WITH (security_barrier = true, security_invoker = true)
AS
SELECT id,
    profile_id,
    business_name,
    slug,
    category,
    category_id,
    custom_category,
    description,
    neighborhood,
    images,
    is_approved,
    subscription_status,
    created_at
FROM vendors
WHERE ((is_approved = true) AND ((subscription_status = 'active'::subscription_status) OR ((approved_at IS NOT NULL) AND (approved_at > (now() - '24:00:00'::interval)))));

GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- 6. Recriar vendors_search com slug
DROP VIEW IF EXISTS public.vendors_search;
CREATE VIEW public.vendors_search
WITH (security_barrier = true, security_invoker = true)
AS
SELECT v.id,
    v.profile_id,
    v.business_name,
    v.slug,
    v.category,
    v.custom_category,
    v.description,
    v.neighborhood,
    v.images,
    v.created_at,
    v.subscription_status,
    v.is_approved,
    v.approved_at,
    v.category_id,
    COALESCE(( SELECT (count(*))::integer AS count
           FROM coupons c
          WHERE ((c.vendor_id = v.id) AND (c.is_active = true) AND (c.expires_at > now()) AND ((c.max_uses IS NULL) OR (c.current_uses < c.max_uses)))), 0) AS active_coupons_count,
    COALESCE(( SELECT (avg(r.rating))::numeric(2,1) AS avg
           FROM reviews r
          WHERE (r.target_id = v.profile_id)), (0)::numeric) AS avg_rating,
    COALESCE(( SELECT (count(*))::integer AS count
           FROM reviews r
          WHERE (r.target_id = v.profile_id)), 0) AS review_count
FROM vendors v
WHERE ((v.is_approved = true) AND ((v.subscription_status = 'active'::subscription_status) OR (v.approved_at > (now() - '24:00:00'::interval))));

GRANT SELECT ON public.vendors_search TO anon, authenticated;