-- Mover extensão unaccent para schema extensions (best practice)
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- Atualizar função para usar extensions.unaccent
CREATE OR REPLACE FUNCTION public.generate_slug(text) 
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          extensions.unaccent($1),
          '[^a-z0-9\s-]', '', 'gi'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;