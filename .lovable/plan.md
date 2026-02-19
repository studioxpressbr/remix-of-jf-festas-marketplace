

## Correção: Fornecedores não aparecem na busca

**Custo: 0 creditos** (correção de bug de configuração de banco de dados)

---

### Diagnostico

Os 4 fornecedores aprovados e ativos existem no banco de dados, mas as consultas do frontend retornam arrays vazios. Dois problemas foram identificados:

1. As views `vendors_search` e `vendors_public` perderam as permissoes GRANT para os papeis `anon` (visitantes) e `authenticated` (usuarios logados)
2. Todas as politicas de segurança (RLS) na tabela base `vendors` sao do tipo RESTRICTIVE. No PostgreSQL, quando so existem politicas restritivas (sem nenhuma permissiva), nenhuma linha e retornada para nenhum usuario

### Solucao

Uma unica migracao SQL que:

1. Concede permissao SELECT nas duas views para `anon` e `authenticated`
2. Adiciona uma politica PERMISSIVA na tabela `vendors` permitindo que qualquer usuario (anon ou autenticado) visualize fornecedores aprovados e ativos
3. Remove a politica restritiva antiga que cobria o mesmo caso ("Approved active vendors viewable by authenticated users"), pois a nova politica permissiva a substitui de forma mais correta

### Detalhes Tecnicos

```text
SQL Migration:

-- 1. Conceder SELECT nas views
GRANT SELECT ON public.vendors_search TO anon, authenticated;
GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- 2. Remover politica restritiva antiga
DROP POLICY IF EXISTS "Approved active vendors viewable by authenticated users" ON public.vendors;

-- 3. Criar politica permissiva (permite anon + authenticated)
CREATE POLICY "Public can view approved active vendors"
  ON public.vendors
  FOR SELECT
  TO anon, authenticated
  USING (
    subscription_status = 'active'::subscription_status
    AND is_approved = true
  );

-- Manter as politicas restritivas existentes:
-- "Admins can view all vendors" (restritiva) -> continua
-- "Vendors can view their own profile" (restritiva) -> continua
-- Essas passam a funcionar como refinamento adicional,
-- mas a nova permissiva garante acesso publico ao basico
```

Resultado: a pagina /buscar e a homepage voltarao a exibir os fornecedores.
