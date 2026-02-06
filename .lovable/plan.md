

# Plano: Implementar Notificações por E-mail para Fornecedores

## 1. Resumo
Com a `RESEND_API_KEY` fornecida (`re_h3ncWfjx_Fp9yvMMbjscskeB1t5ocPRdw`), vou:

1. **Configurar o secret** no backend
2. **Criar Edge Function `notify-vendor-quote`** para enviar e-mails via Resend
3. **Modificar `QuoteModal.tsx`** para disparar a notificação após envio bem-sucedido

## 2. Implementação

### 2.1 Configurar Secret
- Adicionar `RESEND_API_KEY` aos secrets do projeto

### 2.2 Criar Edge Function: `supabase/functions/notify-vendor-quote/index.ts`

**Responsabilidades:**
- Receber `quoteId` do frontend
- Recuperar dados da cotação (quotes + client profile)
- Recuperar e-mail do fornecedor (via vendor_id)
- Construir HTML do e-mail informativo
- Enviar via Resend
- Retornar sucesso ou erro

**Estrutura:**
- CORS headers completos (preflight + error responses)
- Autenticação via JWT (usuário logado)
- Queries ao banco de dados via Supabase client
- Tratamento de erros robusto
- E-mail com:
  - Saudação para o fornecedor
  - Detalhes da cotação (data, pax, descrição)
  - Nome e WhatsApp do cliente
  - Link para dashboard do fornecedor
  - Botão CTA "Ver Cotação"

**Tecnologia:**
- Resend SDK para envio
- From: `onboarding@resend.dev` (pode mudar depois)

### 2.3 Modificar `QuoteModal.tsx`

**Local:** Linhas 80-110 (função `onSubmit`)

**Mudança:**
Após sucesso do insert, chamar a Edge Function de notificação:

```typescript
// Após inserir cotação com sucesso
const { error } = await supabase.from('quotes').insert({...});
if (error) throw error;

// Disparar notificação (não bloqueia UX)
supabase.functions
  .invoke('notify-vendor-quote', {
    body: { quoteId: insertedQuote.id },
  })
  .catch(err => console.error('Notification failed:', err));

toast({
  title: 'Cotação enviada!',
  description: 'O fornecedor receberá sua solicitação.',
});
```

## 3. Fluxo Completo

```
Cliente envia Cotação
       ↓
Insert em 'quotes' (sucesso)
       ↓
Chamar notify-vendor-quote
       ↓
Function recupera dados
       ↓
Envia e-mail via Resend
       ↓
Toast "Cotação enviada!"
```

## 4. Considerações Técnicas

- **Segurança:** RLS garante que vendor só recebe e-mail da sua própria cotação
- **Resiliência:** Se e-mail falhar, cotação já está criada (sucesso parcial aceitável)
- **Domínio:** Usa `onboarding@resend.dev` inicialmente, fácil mudar depois no código da function
- **Deploy:** Automático após criação do arquivo

## 5. Próximas Etapas

1. ✅ Configurar `RESEND_API_KEY`
2. ✅ Criar `notify-vendor-quote/index.ts`
3. ✅ Atualizar `QuoteModal.tsx`
4. ✅ Teste: Enviar cotação e validar recebimento de e-mail

