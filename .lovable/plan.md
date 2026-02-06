
# Plano: Correções e Funcionalidades Pendentes no JF Festas

## Resumo dos Problemas Identificados

| # | Problema | Status | Ação Necessária |
|---|----------|--------|-----------------|
| 1 | Adicionar créditos bônus não funciona | Bug | Corrigir CORS headers na Edge Function |
| 2 | Testar compra de pacote anual e créditos | Bloqueado | **Configurar STRIPE_SECRET_KEY** |
| 3 | Fornecedor recebe e-mail ao receber cotação? | Não implementado | Criar sistema de notificação |
| 4 | Como o fornecedor aponta venda e valor? | Já implementado | Apenas explicar o fluxo |

---

## 1. Corrigir Função "Adicionar Créditos Bônus"

### Problema
O erro "Failed to fetch" indica um problema de CORS. A Edge Function `add-bonus-credits` usa headers CORS simples (`*`) que são mais permissivos, porém falta o header completo usado nas outras funções.

### Correção
Atualizar os CORS headers na função `add-bonus-credits/index.ts`:

```typescript
// ANTES (linha 3-5):
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DEPOIS:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

---

## 2. Testar Compra de Pacote Anual e Créditos

### Problema Crítico
As Edge Functions de pagamento (`purchase-credits`, `create-checkout`, `verify-credit-purchase`) requerem `STRIPE_SECRET_KEY`, mas esta chave **não está configurada** no projeto.

### Ação Necessária
1. Obter a chave secreta do Stripe em https://dashboard.stripe.com/apikeys
2. Configurar o segredo no projeto via ferramenta `add_secret`
3. Após configurar, as funções de compra funcionarão

### Testar Depois da Configuração
- Compra de créditos: Clicar em "Comprar X créditos" no dashboard do fornecedor
- Pacote anual: Clicar em "Ativar por R$ 99/ano" no dashboard

---

## 3. Notificação por E-mail para Fornecedores (Nova Cotação)

### Status Atual
Quando um cliente envia uma cotação (via `QuoteModal.tsx`), os dados são salvos no banco, mas **nenhuma notificação é enviada** ao fornecedor.

### Solução Proposta
Criar uma Edge Function `notify-vendor-quote` que será chamada após inserir uma cotação. 

### Fluxo:
1. Cliente envia cotação → Insere no banco
2. Após sucesso, chamar Edge Function de notificação
3. Function busca e-mail do fornecedor e envia via Resend

### Arquivos a Criar/Modificar:
| Arquivo | Ação |
|---------|------|
| `supabase/functions/notify-vendor-quote/index.ts` | Criar função |
| `src/components/vendor/QuoteModal.tsx` | Chamar função após insert |

### Dependência
Requer configurar `RESEND_API_KEY` como segredo para enviar e-mails.

---

## 4. Como o Fornecedor Aponta Venda e Valor

### Já Está Implementado!

O fluxo completo existe:

1. **Fornecedor desbloqueia lead** → Usa 1 crédito
2. **Aparece botão "Fechei negócio"** no card da cotação
3. **Modal `DealClosedModal`** abre para informar valor
4. **Dados salvos em `leads_access`**:
   - `deal_closed = true`
   - `deal_value = valor informado`
   - `deal_closed_at = timestamp`

### Código Existente (VendorDashboard.tsx linhas 545-556):
```tsx
{!dealClosed && leadAccess && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => setDealModal({
      leadAccessId: leadAccess.id,
      clientName: quote.profiles?.full_name || 'Cliente',
    })}
  >
    <Handshake className="mr-2 h-4 w-4" />
    Fechei negócio
  </Button>
)}
```

### Para Marketing/ROI
Os dados de `deal_value` podem ser consultados para relatórios:
```sql
SELECT SUM(deal_value) as total_vendas, COUNT(*) as negocios_fechados
FROM leads_access WHERE deal_closed = true;
```

---

## Estimativa de Créditos

| Tarefa | Créditos |
|--------|----------|
| Corrigir CORS do add-bonus-credits | 1 |
| Configurar STRIPE_SECRET_KEY | 0 (apenas configuração) |
| Criar notificação por e-mail (se aprovado) | 2-3 |
| **Total imediato** | **1 crédito** |
| **Total com notificações** | **3-4 créditos** |

---

## Próximos Passos Recomendados

1. **Aprovar este plano** para corrigir a função de créditos bônus
2. **Configurar STRIPE_SECRET_KEY** via ferramenta de segredos
3. **Decidir sobre notificações por e-mail**:
   - Precisa configurar Resend (RESEND_API_KEY)
   - Posso criar a estrutura após os passos 1-2

Deseja que eu prossiga com a correção do item 1 e a configuração do Stripe?
