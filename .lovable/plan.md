
## Implementação da Automação de Solicitação de Avaliação (Cron + Edge Function)

### Status Atual

✅ **Concluído:**
- Edge function `send-review-request` criada com lógica completa de busca e envio de e-mails
- Extensões `pg_cron` e `pg_net` habilitadas
- Secret `RESEND_API_KEY` configurado
- RLS policies criadas
- Coluna `review_requested_at` adicionada à tabela `leads_access`

❌ **Pendente:**
- Agendar o cron job para executar a edge function diariamente
- Testar o fluxo completo

### O Que Será Feito

**1. Agendar Cron Job (SQL Migration)**

Criar uma nova migração SQL que:
- Defina o cron job `send-review-requests-daily` para executar a edge function diariamente às 13:00 UTC
- Use `net.http_post` para chamar a edge function via HTTP
- Inclua o header de Authorization com o anon key do projeto (para que a função processe sem erro)

SQL a ser executado:
```sql
SELECT cron.schedule(
  'send-review-requests-daily',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url:='https://zmkykifewxehtgxthpof.supabase.co/functions/v1/send-review-request',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpta3lraWZld3hlaHRneHRocG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjgyMzgsImV4cCI6MjA4NTA0NDIzOH0.TfbodVNWB8PkkTPqkElS5cPPs6Zrh25ObyrDBVXmca4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

**2. Validar a Edge Function**

A implementação atual já contém:
- ✅ Busca de leads elegíveis (deal_closed = true, event_date < hoje, review_requested_at IS NULL)
- ✅ Verificação se review já existe
- ✅ Envio de e-mail via Resend com template em português
- ✅ Atualização de `review_requested_at` para evitar reenvios
- ✅ Logging de sucessos e erros
- ✅ Tratamento de CORS headers

Pequeno ajuste sugerido:
- Adicionar validação para garantir que `deal_value` foi informado antes de enviar o e-mail (regra de negócio: só avaliar se o valor foi preenchido)

**3. Teste Manual (Ação do Usuário)**

Após a migração:
- Ir para o Cloud Backend e executar manualmente a edge function via testes
- Ou esperar a execução do cron job às 13:00 UTC
- Verificar nos logs da função se está funcionando

### Arquivos a Serem Criados/Editados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/20260212_schedule_review_cron.sql` | Criar | Agendar cron job para executar a edge function |
| `supabase/functions/send-review-request/index.ts` | Editar (opcional) | Adicionar validação de `deal_value` |

### Cronograma de Execução

- **13:00 UTC (diariamente)**: Edge function é triggerada pelo cron job
- Processa todos os leads elegíveis desde a última execução
- Envia e-mails de convite aos clientes
- Atualiza `review_requested_at` para evitar reenvios

