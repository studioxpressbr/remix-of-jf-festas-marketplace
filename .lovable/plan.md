

## Notificacao ao Fornecedor e Visibilidade do Aceite de Proposta

### Contexto
Quando o cliente aceita ou recusa uma proposta, atualmente:
- O fornecedor so ve um emoji (checkmark/X) ao lado do badge "Proposta Enviada" no dashboard, sem destaque
- O fornecedor nao recebe nenhuma notificacao (nem interna, nem por e-mail)
- O painel admin nao exibe informacoes sobre propostas ou respostas dos clientes

### Mudancas Planejadas

---

### 1. Notificacao interna ao fornecedor (sino)

Quando o cliente aceita ou recusa a proposta no `ClientProposalCard.tsx`, inserir uma mensagem interna na tabela `user_messages` para o fornecedor.

**Arquivo:** `src/components/client/ClientProposalCard.tsx`
- Apos o update da quote (linha ~50), inserir um registro em `user_messages` com:
  - `recipient_id`: o `vendor_id` da quote (necessario buscar via query ou receber como prop)
  - `subject`: "Proposta aceita!" ou "Proposta recusada"
  - `content`: mensagem descritiva com o valor e nome do cliente
- Sera necessario adicionar uma prop `vendorProfileId` ao componente para saber quem notificar

**Nota:** A insercao em `user_messages` via client-side falhara porque a RLS exige `has_admin_role`. A solucao e usar a Edge Function `send-user-message` ja existente, mas ela tambem valida admin. A alternativa mais simples e adicionar uma nova politica RLS que permite clientes inserirem mensagens para fornecedores de suas proprias quotes, OU criar uma Edge Function dedicada `notify-proposal-response`.

**Decisao:** Criar uma Edge Function `notify-proposal-response` que:
- Recebe `quoteId` e `response` (accepted/rejected)
- Valida que o usuario autenticado e o cliente da quote
- Insere mensagem interna via service role
- Opcionalmente envia e-mail via Resend (seguindo o padrao da `notify-vendor-quote`)

---

### 2. Melhorar visibilidade no painel do fornecedor

**Arquivo:** `src/pages/VendorDashboard.tsx` (linhas 636-643)
- Substituir o badge generico "Proposta Enviada + emoji" por badges mais claros:
  - Se `client_response === 'accepted'`: Badge verde com "Proposta Aceita" e icone CheckCircle
  - Se `client_response === 'rejected'`: Badge vermelho com "Proposta Recusada" e icone XCircle  
  - Se sem resposta: Badge secundario com "Aguardando Resposta" e icone Clock
- Mostrar o valor proposto ao lado do badge de status

---

### 3. Visibilidade no painel admin

**Arquivo:** `src/components/admin/DealsReportSection.tsx`
- Expandir a interface `ClosedDeal` para incluir `client_response` e `proposed_value`
- Adicionar coluna "Via Proposta" na tabela de ranking ou nos detalhes dos deals

**Arquivo:** `src/pages/Admin.tsx`
- Na query que busca deals, incluir dados de `quotes` (proposed_value, client_response) via join
- Permitir que o admin veja quais negocios foram fechados via aceite de proposta vs fechamento manual

---

### 4. Notificacao por e-mail (opcional, mesmo padrao existente)

**Arquivo:** `supabase/functions/notify-proposal-response/index.ts` (novo)
- Seguir o mesmo padrao da `notify-vendor-quote`
- Enviar e-mail ao fornecedor informando que o cliente respondeu a proposta
- Incluir valor, nome do cliente e link para o dashboard

---

### Detalhes Tecnicos

#### Nova Edge Function: `notify-proposal-response`
```
Entrada: { quoteId: string, response: 'accepted' | 'rejected' }
Validacao: usuario autenticado = client_id da quote
Acoes:
  1. Buscar dados da quote (vendor_id, proposed_value, client info)
  2. Inserir em user_messages (via service role) para o vendor_id
  3. Enviar e-mail via Resend para o fornecedor
Retorno: { success: true }
```

#### Chamada no ClientProposalCard
- Apos o update da quote e leads_access, chamar `supabase.functions.invoke('notify-proposal-response', { body: { quoteId, response } })`

#### Mudanca no VendorDashboard (linhas 636-643)
- Antes: badge unico "Proposta Enviada" com emoji
- Depois: badges separados por estado com cores e icones distintos

#### Mudanca no Admin
- Adicionar indicador visual nos deals mostrando se foram fechados via proposta aceita ou manualmente

### Sequencia de Implementacao
1. Criar Edge Function `notify-proposal-response`
2. Atualizar `ClientProposalCard.tsx` para chamar a funcao
3. Melhorar badges no `VendorDashboard.tsx`
4. Adicionar info de proposta no painel admin
