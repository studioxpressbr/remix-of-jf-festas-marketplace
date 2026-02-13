
## Fornecedor Tambem e Cliente (Nativamente)

### Conceito
Todo fornecedor autenticado pode solicitar cotacoes de outros fornecedores, sem precisar de outro role ou toggle. No dashboard do fornecedor, alem das "Cotacoes Recebidas" ja existentes, aparece uma nova aba "Minhas Cotacoes" mostrando as cotacoes que ele enviou como comprador.

### O que precisa mudar

---

### 1. RLS da tabela `quotes` (1 migracao)

Atualmente, a politica de INSERT exige `auth.uid() = client_id`, mas a de SELECT para clientes (`Clients can view their own quotes`) e UPDATE (`Clients can update their own quotes`) verificam `auth.uid() = client_id` -- isso ja funciona para vendors tambem, pois checa apenas o uid.

**Unica restricao real:** A politica de INSERT usa `WITH CHECK (auth.uid() = client_id)`, que ja permite qualquer usuario autenticado inserir desde que `client_id = auth.uid()`. Nao precisa alterar.

**Verificacao necessaria:** Confirmar que a RLS da tabela `profiles` permite que vendors vejam perfis de outros vendors aprovados. Atualmente a politica "Clients can view vendor profiles" verifica `EXISTS(vendors WHERE profile_id = profiles.id AND is_approved AND subscription_status = 'active')` -- isso funciona para qualquer usuario autenticado, nao apenas clients.

**Conclusao:** Nenhuma migracao de RLS necessaria! As politicas existentes ja permitem o fluxo.

---

### 2. Impedir auto-cotacao (frontend)

**Arquivo:** `src/pages/VendorProfile.tsx`
- No `handleQuoteClick`, adicionar verificacao: se `user.id === vendor.profile_id`, mostrar toast "Voce nao pode solicitar cotacao para si mesmo" e nao abrir o modal.

---

### 3. Nova aba "Minhas Cotacoes" no VendorDashboard

**Arquivo:** `src/pages/VendorDashboard.tsx`
- Adicionar uma query para buscar cotacoes onde `client_id = user.id` (cotacoes enviadas pelo vendor como comprador)
- Adicionar uma secao/aba "Minhas Cotacoes (como comprador)" abaixo ou ao lado das cotacoes recebidas
- Cada card mostra: nome do fornecedor, data do evento, numero de pessoas, status da proposta recebida
- Se houver proposta do fornecedor, mostrar valor e botoes de aceitar/recusar (reutilizar logica do `ClientProposalCard`)

---

### 4. Mostrar botao "Solicitar Cotacao" para vendors no perfil de outros vendors

**Arquivo:** `src/pages/VendorProfile.tsx`
- Atualmente o botao "Solicitar Cotacao" aparece para todos os usuarios logados (nao ha restricao por role)
- Verificar que nao ha condicao escondida que bloqueia vendors -- ja verificado, `handleQuoteClick` so checa `!user`
- Apenas adicionar a restricao de auto-cotacao (item 2)

---

### Sequencia de Implementacao

1. **Adicionar verificacao de auto-cotacao** no `VendorProfile.tsx` (~1 edicao simples)
2. **Adicionar secao "Minhas Cotacoes"** no `VendorDashboard.tsx` com query e cards (~1-2 creditos)
3. **Reutilizar/adaptar `ClientProposalCard`** para mostrar propostas recebidas pelo vendor-comprador (~1 credito)

### Estimativa: ~3 creditos

### Detalhes Tecnicos

#### Query para cotacoes enviadas (VendorDashboard)
```text
supabase
  .from('quotes')
  .select('*, vendors!inner(business_name, images, slug)')
  .eq('client_id', user.id)
  .order('created_at', { ascending: false })
```

Nota: O join com `vendors` usa `quotes.vendor_id = vendors.profile_id` -- precisa verificar se o FK esta configurado corretamente ou usar uma subquery.

#### Componente de card para cotacoes enviadas
Reutilizar a estrutura visual do `ClientProposalCard` existente, adaptando para o contexto do vendor-comprador. Incluir:
- Nome do fornecedor destino
- Data do evento e numero de pessoas
- Status (aberta, proposta recebida, aceita, recusada)
- Botoes de aceitar/recusar proposta (mesma logica do ClientDashboard)

#### Auto-cotacao
```text
if (user?.id === vendor.profile_id) {
  toast.error('Voce nao pode solicitar cotacao para si mesmo');
  return;
}
```
