
## Ativar Stripe em Modo Producao (Live)

**Custo estimado: 1 credito** (atualizacao de Price IDs em `constants.ts` e na edge function `buy-lead-credit`)

---

### O que precisa ser feito

Existem **3 lugares** onde os IDs do Stripe precisam ser atualizados para os equivalentes de producao (`live`):

| Arquivo | O que atualizar |
|---|---|
| Segredo `STRIPE_SECRET_KEY` | Substituir `sk_test_...` por `sk_live_...` |
| `src/lib/constants.ts` | 3 Price IDs e 3 Product IDs (MEI, Empresarial, Creditos) |
| `supabase/functions/buy-lead-credit/index.ts` | `LEAD_CREDIT_PRICE_ID` hardcoded na linha 26 |

---

### Passo 1 — Atualizar a chave secreta (voce faz isso)

No Lovable, acesse **Settings → Secrets** e atualize o valor de `STRIPE_SECRET_KEY` com sua chave `sk_live_...` obtida em [dashboard.stripe.com → Developers → API Keys](https://dashboard.stripe.com/apikeys) (certifique-se de desativar o "Test mode" la).

---

### Passo 2 — Obter os Price IDs de producao (voce faz isso no Stripe)

No painel do Stripe em modo **Live**, acesse **Products** e copie os IDs dos produtos e precos que correspondem a:

- **Plano MEI** (R$ 99/ano): `price_live_...` e `prod_live_...`
- **Plano Empresarial** (R$ 499/ano): `price_live_...` e `prod_live_...`
- **Creditos para Leads** (R$ 2/unidade): `price_live_...` e `prod_live_...`

Se os produtos ainda nao existem em modo Live, voce precisa cria-los no painel do Stripe antes de continuar.

---

### Passo 3 — Eu atualizo o codigo (1 credito)

Com os IDs de producao em maos, eu atualizo:

1. **`src/lib/constants.ts`** — os 6 IDs (3 price + 3 product) nos objetos `STRIPE_MEI_PLAN`, `STRIPE_EMPRESARIAL_PLAN` e `STRIPE_LEAD_CREDITS`
2. **`supabase/functions/buy-lead-credit/index.ts`** — o `LEAD_CREDIT_PRICE_ID` na linha 26

---

### Como proceder

1. Atualize o segredo `STRIPE_SECRET_KEY` com sua chave `sk_live_...`
2. Me envie os Price IDs e Product IDs de producao do seu painel Stripe
3. Eu atualizo o codigo e a edge function automaticamente
4. Publique o projeto para que as alteracoes entrem em vigor no site jffestas.lovable.app

> **Importante:** Apos a troca, qualquer pagamento processado sera real e cobrado no cartao do cliente. Confirme que os produtos e precos no Stripe Live estao corretos antes de publicar.
