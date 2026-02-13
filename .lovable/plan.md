

## Funcionalidade: Cotacao com Proposta de Valor + Anexo de Contrato

Esta funcionalidade permite que o fornecedor, ao enviar uma proposta para o cliente, inclua um valor, uma mensagem opcional e, opcionalmente, um arquivo de contrato (PDF ou documento).

---

### Fluxo Completo

```text
Cliente solicita cotacao (ja existe)
        |
Fornecedor desbloqueia lead (ja existe)
        |
Fornecedor envia proposta:
  - Valor (R$) obrigatorio
  - Mensagem opcional
  - Contrato em anexo (PDF/DOC, opcional, max 10MB)
        |
Cliente recebe e visualiza proposta + download do contrato
        |
Cliente aceita ou recusa
```

---

### Alteracoes Necessarias

#### 1. Novo Bucket de Storage: `vendor-contracts`

Bucket publico para armazenar os contratos enviados pelos fornecedores. Politica RLS permitindo upload por usuarios autenticados e leitura publica.

#### 2. Migracao SQL

Adicionar colunas na tabela `quotes`:

- `proposed_value` (numeric, nullable) - valor proposto
- `proposal_message` (text, nullable) - mensagem opcional
- `proposed_at` (timestamptz, nullable) - data da proposta
- `contract_url` (text, nullable) - URL do contrato anexado
- `client_response` (text, nullable) - 'accepted' ou 'rejected'
- `client_responded_at` (timestamptz, nullable) - data da resposta

Atualizar RLS de `quotes`: fornecedores precisam de UPDATE nas colunas de proposta; clientes precisam de UPDATE para registrar resposta.

#### 3. Componente: Modal de Proposta do Fornecedor

Novo `VendorProposalModal.tsx`:
- Campo de valor (R$) com mascara monetaria
- Campo de mensagem (textarea, opcional)
- Botao de upload de contrato (PDF/DOC/DOCX, max 10MB, opcional)
- Preview do arquivo selecionado com opcao de remover
- Upload vai para o bucket `vendor-contracts`
- Ao salvar: atualiza `quotes` com valor, mensagem, URL do contrato e status `proposed`

#### 4. Interface de Resposta do Cliente

No `ClientDashboard.tsx`, secao de propostas recebidas:
- Exibe valor proposto, mensagem, data
- Link de download do contrato (se anexado)
- Botoes "Aceitar" e "Recusar"
- Aceitar: atualiza status para `completed`, `deal_closed = true`, `deal_value` automatico
- Recusar: registra `client_response = 'rejected'`

#### 5. Atualizacao dos Dashboards

- **VendorDashboard**: botao "Enviar Proposta" para leads desbloqueados; badge "Proposta Enviada" com indicador de contrato anexado
- **ClientDashboard**: secao destacada para propostas pendentes; historico de respostas

#### 6. Notificacao (opcional)

Edge function para notificar o cliente por e-mail quando recebe uma proposta.

---

### Estimativa de Creditos

| Item | Creditos |
|------|----------|
| Migracao SQL (colunas + enum + RLS + bucket) | 0.5 |
| Modal de proposta com upload de contrato | 1.5 |
| Interface de resposta do cliente | 1 |
| Atualizacao dos dashboards + status | 1 |
| Edge function de notificacao (opcional) | 0.5 |
| **Total** | **3-5** |

---

### Detalhes Tecnicos

**Upload de contrato:**
- Bucket `vendor-contracts` (publico, similar ao `vendor-images`)
- Tipos aceitos: PDF, DOC, DOCX
- Tamanho maximo: 10MB
- Nome do arquivo gerado com timestamp para evitar colisoes
- Padrao de upload identico ao usado em `ImageUpload.tsx` (Supabase Storage SDK)

**Validacao:**
- Valor proposto: numero positivo, obrigatorio
- Contrato: validacao de tipo MIME (application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- Mensagem: max 500 caracteres

**RLS adicional:**
- Fornecedores podem fazer UPDATE em `quotes` apenas para colunas de proposta, quando `vendor_id = auth.uid()`
- Clientes podem fazer UPDATE apenas em `client_response` e `client_responded_at`, quando `client_id = auth.uid()`

