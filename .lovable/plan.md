
## Trocar botões de /precos para links diretos do Stripe

### Links recebidos

| Produto | URL |
|---|---|
| Plano MEI | `https://buy.stripe.com/3cIaEZ6L0arK5OO66l8og00` |
| Plano Empresarial | `https://buy.stripe.com/9B63cx9Xc1Ve2CCamB8og01` |
| Créditos de Contato | `https://buy.stripe.com/fZu4gB4CSbvO1yycuJ8og02` |

---

### Impacto na página de sucesso

Com o fluxo atual via edge function, o Stripe retorna para:
```
/pagamento-sucesso?session_id=cs_live_...
```
A página usa esse `session_id` para verificar o pagamento via a função `verify-payment`.

Com links diretos do Stripe, **o Stripe não passa `session_id` na URL**. Ele redireciona para a URL configurada no painel do Stripe (ex: `https://jffestas.lovable.app/pagamento-sucesso`), sem parâmetros adicionais.

Isso significa que a página `/pagamento-sucesso` atual mostrará o estado de erro ou simplesmente "não verificado" porque não há `session_id` para consultar.

**Solução:** Adaptar a página `/pagamento-sucesso` para exibir diretamente a mensagem de sucesso quando não há `session_id` na URL, já que a presença na página já indica que o Stripe redirecionou após pagamento aprovado.

---

### Arquivos a editar

**1. `src/pages/Precos.tsx`**

- Remover imports não utilizados: `useState`, `supabase`, `useAuthContext`, `AuthProvider`, `useToast`, constantes do Stripe (`STRIPE_MEI_PLAN`, `STRIPE_EMPRESARIAL_PLAN`, `STRIPE_LEAD_CREDITS`)
- Remover as funções `handleSubscribe` e `handleBuyCredits`
- Substituir os `<Button onClick={...}>` por `<a href="..." target="_blank" rel="noopener noreferrer">` com estilo de botão
- Manter os imports das constantes de preços (`MEI_PLAN_PRICE`, `EMPRESARIAL_PLAN_PRICE`, `LEAD_PRICE`)
- Remover o wrapper `<AuthProvider>` e simplificar o componente (não é mais necessário)

**2. `src/pages/PagamentoSucesso.tsx`**

- Quando não há `session_id` na URL (fluxo via link direto): exibir diretamente a tela de sucesso — "Pagamento realizado! Em breve sua assinatura será ativada."
- Quando há `session_id` (fluxo antigo ainda pode ser usado): manter a verificação existente
- Adicionar uma mensagem informando que a ativação pode levar alguns minutos, já que sem `session_id` não é possível verificar instantaneamente via API

---

### Resultado esperado

- Clicar em "Começar Agora" no Plano MEI → abre `buy.stripe.com/...` em nova aba
- Após pagamento, o Stripe redireciona para `jffestas.lovable.app/pagamento-sucesso` com mensagem de sucesso clara
- A página de créditos (`/creditos-sucesso`) não é afetada pois o link de créditos usará a mesma URL de retorno de sucesso de planos, ou pode ser configurado para `/creditos-sucesso` separadamente no painel do Stripe

---

### Observação sobre ativação de assinatura

Sem o `session_id`, a ativação do plano não acontece automaticamente via código. Existem duas opções:

1. **Configurar webhook no Stripe** para que o Stripe notifique o backend quando o pagamento for confirmado (recomendado para produção)
2. **Ativação manual** pelo admin no painel enquanto o webhook não está configurado

O plano atual implementa apenas a troca dos botões e a adaptação da tela de sucesso. A configuração de webhook pode ser feita em um passo separado.
