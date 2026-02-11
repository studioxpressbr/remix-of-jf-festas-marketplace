

## Avaliacao de Fornecedor pelo Cliente (com verificacao de valor do projeto)

### Resumo

Permitir que clientes avaliem fornecedores apos o evento, com as seguintes regras:

1. O fornecedor precisa ter informado o valor do negocio (`deal_closed = true` com `deal_value`)
2. A data do evento precisa ter passado
3. O cliente visualiza o valor informado pelo fornecedor antes de avaliar (transparencia)
4. O valor do projeto nao fica publico -- apenas admin, fornecedor e o proprio cliente (no momento da avaliacao) conseguem ve-lo
5. E-mail automatico enviado ao cliente apos a data do evento solicitando avaliacao
6. Avaliacoes exibidas na pagina publica do fornecedor (sem valor do projeto)

### Creditos estimados: ~2 creditos

| Acao | Creditos |
|---|---|
| 1. Modal de avaliacao do cliente + integracao no dashboard | ~1 |
| 2. Edge function de e-mail + cron + exibicao de reviews no perfil publico | ~1 |
| **Total** | **~2** |

---

### Detalhes tecnicos

**1. Novo componente: `src/components/client/ClientReviewVendorModal.tsx`**

Modal com:
- Exibicao do valor do projeto informado pelo fornecedor (somente leitura, para conferencia)
- Texto: "O fornecedor informou o valor de R$ X.XXX,XX para este servico. Se houver divergencia, entre em contato conosco."
- Estrelas de 1 a 5 (mesmo padrao visual do `VendorReviewClientModal`)
- Campo de comentario opcional (max 500 caracteres)
- Insere na tabela `reviews` com `reviewer_id = client_id`, `target_id = vendor_profile_id`
- Protecao contra duplicata (codigo 23505)

**2. Atualizar `src/pages/ClientDashboard.tsx`**

- Buscar dados de `leads_access` para cada cotacao (deal_closed, deal_value)
- Buscar reviews existentes do cliente para saber quais ja foram avaliadas
- Condicoes para exibir botao "Avaliar Fornecedor":
  - `deal_closed = true` (fornecedor informou valor)
  - `event_date < hoje` (evento ja passou)
  - Nao existe review do cliente para aquela cotacao
- O botao abre o `ClientReviewVendorModal` passando o `deal_value` para exibicao

**3. Politica RLS para acesso do cliente ao `leads_access`**

Nova politica SELECT em `leads_access`:
- Permite que o cliente veja registros de `leads_access` ligados as suas proprias cotacoes
- Query: `EXISTS (SELECT 1 FROM quotes WHERE quotes.id = leads_access.quote_id AND quotes.client_id = auth.uid())`
- Isso permite ao cliente ver `deal_closed` e `deal_value` sem expor dados de outros clientes

**4. Nova Edge Function: `supabase/functions/send-review-request/index.ts`**

- Usa service_role para buscar cotacoes elegiveais
- Criterios:
  - `leads_access.deal_closed = true`
  - `quotes.event_date < hoje`
  - Nao existe review do cliente para aquela cotacao
  - `leads_access.review_requested_at IS NULL`
- Envia e-mail via Resend com template em portugues
- Atualiza `review_requested_at` para evitar reenvio

**5. Migracao SQL**

- Adicionar coluna `review_requested_at` (timestamp, nullable) em `leads_access`
- Adicionar politica RLS SELECT em `leads_access` para clientes
- Configurar `pg_cron` para chamar a edge function diariamente as 10h

**6. Exibir avaliacoes na pagina do fornecedor (`src/pages/VendorProfile.tsx`)**

- Nova secao "Avaliacoes de Clientes" abaixo da descricao
- Buscar reviews onde `target_id = vendor.profile_id`
- Exibir: estrelas (componente `StarRating`), comentario, data
- Nome do avaliador (primeiro nome apenas, por privacidade)
- Media e contagem no topo da secao
- Valor do negocio NAO e exibido aqui (privacidade)

### Privacidade do valor do projeto

- **Publico (pagina do fornecedor)**: Apenas estrelas + comentario. Sem valor.
- **Cliente**: Ve o valor informado pelo fornecedor somente no modal de avaliacao (antes de avaliar)
- **Admin**: Acesso total via relatorio de negocios (aba Negocios)
- **Fornecedor**: Ve o valor que ele mesmo informou no seu dashboard

### Arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/components/client/ClientReviewVendorModal.tsx` | Criar |
| `src/pages/ClientDashboard.tsx` | Editar (fetch leads_access + reviews + botao avaliar) |
| `src/pages/VendorProfile.tsx` | Editar (secao de avaliacoes) |
| `supabase/functions/send-review-request/index.ts` | Criar |
| Migracao SQL | Coluna `review_requested_at` + RLS cliente + cron |

