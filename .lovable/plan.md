

## Plano de Segurança do Site

**Créditos estimados: 3-4**

### Resumo da Auditoria

Foi realizada uma varredura completa de segurança. Abaixo estão os problemas encontrados, organizados por prioridade.

### Problemas Críticos (ERRO)

#### 1. Views com SECURITY DEFINER (`vendors_public` e `vendors_search`)
As views `vendors_public` e `vendors_search` usam `SECURITY DEFINER`, o que significa que qualquer consulta a essas views roda com as permissões do criador (normalmente superusuário), ignorando as políticas de RLS.

**Solução:** Recriar ambas as views como `SECURITY INVOKER` para que respeitem as permissões do usuário que consulta. Manter os `GRANT SELECT` para `anon` e `authenticated`.

#### 2. Tabela `reviews` expõe IDs de usuários publicamente
A política atual permite `SELECT` com `USING (true)`, ou seja, qualquer pessoa (inclusive não autenticada) pode ver todos os reviews, incluindo `reviewer_id` e `target_id`.

**Solução:** Restringir a política de SELECT para que apenas usuários autenticados vejam reviews. Os IDs dos usuários já são UUIDs (difíceis de adivinhar), mas limitar o acesso a autenticados reduz o risco de scraping em massa.

#### 3. Tabela `coupons` expõe dados comerciais sensíveis
Cupons ativos são visíveis por qualquer pessoa, incluindo `vendor_id`, `min_order_value`, `current_uses` e `max_uses`. Concorrentes podem usar essas informações.

**Solução:** Restringir a política de SELECT de cupons ativos para apenas usuários autenticados.

### Problemas Importantes (AVISO)

#### 4. Proteção contra senhas vazadas desativada
O recurso "Leaked Password Protection" está desativado. Isso significa que usuários podem cadastrar senhas que já foram comprometidas em outros sites.

**Solução:** Isso precisa ser ativado manualmente nas configurações de autenticação do backend. Vou orientar como fazer.

#### 5. Views `vendors_public` e `vendors_search` sem políticas de RLS
Apesar de terem RLS habilitado, não possuem políticas definidas. Atualmente funcionam porque têm `GRANT SELECT`, mas é uma configuração frágil.

**Solução:** Após recriar como `SECURITY INVOKER`, adicionar políticas explícitas de SELECT para `anon` e `authenticated`.

### Problemas Importantes (segurança por obscuridade)

#### 6. URLs de fornecedores expõem IDs internos
As URLs públicas dos fornecedores usam `profile_id` (UUID), ex: `/vendor/a1b2c3d4-...`. Embora UUIDs sejam difíceis de adivinhar, expor IDs internos é uma má prática de segurança. Além disso, URLs com o nome da empresa são melhores para SEO e experiência do usuário.

**Solução:** Adicionar um campo `slug` à tabela `vendors` (gerado a partir do `business_name`), criar um índice único, e alterar as rotas para usar `/fornecedor/:slug` em vez de `/vendor/:profile_id`. Manter compatibilidade com URLs antigas via redirect.

### Problemas Informativos (baixo risco)

#### 7. Tabelas sem políticas de DELETE/UPDATE
- `quotes`: clientes não podem deletar cotações
- `reviews`: não podem ser editadas ou removidas
- `vendor_credits`: não podem ser corrigidos

**Solução:** Estes são por design (imutabilidade). Vou marcar como intencionais no sistema de segurança, sem alterações necessárias.

#### 7. `payment_transactions` sem INSERT via RLS
Inserções acontecem via edge functions com `service_role`. Isso é intencional e seguro.

### Plano de Execução

**Etapa 1 - Migration SQL (1 crédito):** ✅ CONCLUÍDA
- Recriar views `vendors_public` e `vendors_search` como `SECURITY INVOKER`
- Alterar política de `reviews` de `USING (true)` para `USING (auth.uid() IS NOT NULL)`
- Alterar política de `coupons` para exigir autenticação

**Etapa 2 - Slug de fornecedores (1-2 créditos):**
- Adicionar coluna `slug` (TEXT UNIQUE) à tabela `vendors`
- Criar função SQL para gerar slug a partir do `business_name` (lowercase, sem acentos, hifenizado)
- Popular slugs para todos os fornecedores existentes
- Incluir `slug` nas views `vendors_public` e `vendors_search`
- Atualizar rotas no frontend: `/fornecedor/:slug` em vez de `/vendor/:profile_id`
- Atualizar todos os links internos (VendorCard, VendorThumbnail, CategoryPage, etc.)
- Redirect de URLs antigas (`/vendor/:id`) para manter compatibilidade

**Etapa 3 - Validação e marcação (1 crédito):**
- Testar que as views continuam funcionando para usuários autenticados e visitantes
- Testar que URLs com slug funcionam e URLs antigas redirecionam
- Marcar findings intencionais (DELETE em quotes, reviews, credits) como ignorados no scanner

**Etapa 4 - Orientação manual:**
- Instruções para ativar "Leaked Password Protection" nas configurações do backend

### Impacto no Usuário Final

- A busca pública de fornecedores continuará funcionando normalmente (views com GRANT para `anon`)
- Reviews e cupons só serão visíveis para usuários logados
- URLs de fornecedores mudam de `/vendor/uuid` para `/fornecedor/nome-da-empresa` (mais limpo e seguro)
- URLs antigas serão redirecionadas automaticamente

### Observação Importante

As políticas de RLS existentes para `profiles`, `vendors`, `leads_access` e `payment_transactions` já estão bem configuradas com acesso granular. O foco deste plano são as lacunas identificadas na auditoria.

