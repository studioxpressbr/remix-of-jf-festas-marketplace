
# Plano de Implementacao - Correcoes e Melhorias (Itens 2-6)

## Resumo Executivo

Este plano agrupa as tarefas em **3 mensagens** para minimizar o uso de creditos:

| Mensagem | Itens | Descricao |
|----------|-------|-----------|
| 1 | 4, 5, 6 | Correcoes de bugs (Reset Password, Link Admin, Traducoes) |
| 2 | 2 | Dashboard do Cliente |
| 3 | 3 | Melhorias no Admin (colunas + filtros) |

**Total estimado: 3-4 creditos**

---

## Mensagem 1: Correcoes de Bugs (Itens 4, 5, 6)

### Item 4: Fix Reset Password Link

**Problema Identificado:**
O template `recovery.html` usa `{{ .ConfirmationURL }}` que redireciona para o Supabase por padrao. O link deveria redirecionar para `/reset-password` da aplicacao.

**Solucao:**
O `AuthModal.tsx` ja configura corretamente o `redirectTo`:
```typescript
redirectTo: `${window.location.origin}/reset-password`
```

O problema pode estar na configuracao do Supabase. Sera necessario verificar se o redirect URL esta configurado corretamente nas configuracoes de autenticacao.

**Arquivos a editar:**
- `supabase/config.toml` - Adicionar configuracao de site URL

### Item 5: Traducao dos Emails

**Status Atual:**
Todos os 5 templates de email ja estao em Portugues:
- `recovery.html` - OK (Recuperacao de Senha)
- `confirmation.html` - OK (Confirme seu Email)
- `magic_link.html` - OK (Link de Acesso)
- `invite.html` - OK (Voce foi Convidado)
- `email_change.html` - OK (Alteracao de Email)

**Acao:** Nenhuma alteracao necessaria - ja traduzidos.

### Item 6: Fix Link "Ver Cadastro do Fornecedor" no Admin

**Problema Identificado:**
No `Admin.tsx`, linha 366:
```typescript
onClick={() => navigate(`/vendor/${vendor.id}`)}
```

Mas `VendorProfile.tsx` busca por `profile_id`:
```typescript
.eq('profile_id', id)
```

**Solucao:**
Alterar para:
```typescript
onClick={() => navigate(`/vendor/${vendor.profile_id}`)}
```

**Arquivos a editar:**
- `src/pages/Admin.tsx` - Linha 366: mudar `vendor.id` para `vendor.profile_id`

---

## Mensagem 2: Dashboard do Cliente (Item 2)

### Novos Arquivos a Criar

**1. `src/pages/ClientDashboard.tsx`**

Funcionalidades:
- Verificar se usuario logado tem role 'client'
- Exibir card de perfil com nome, email, WhatsApp
- Botao para editar perfil
- Lista de cotacoes solicitadas com:
  - Nome do fornecedor
  - Categoria
  - Data do evento
  - Numero de pessoas
  - Status da cotacao
  - Data de envio

**2. `src/components/client/ClientEditProfileModal.tsx`**

Campos editaveis:
- Nome completo
- WhatsApp
- Email

Diferenca do modal de fornecedor: salva imediatamente, sem re-aprovacao.

### Arquivos a Editar

**3. `src/App.tsx`**
- Adicionar rota `/minha-conta` para `ClientDashboard`

**4. `src/components/layout/Header.tsx`**
- Adicionar link "Minha Conta" no menu para clientes logados (role === 'client')
- Desktop: no dropdown do usuario
- Mobile: no menu mobile

### Query de Cotacoes

```typescript
const { data } = await supabase
  .from('quotes')
  .select(`
    *,
    vendors!quotes_vendor_id_fkey(
      business_name, 
      category, 
      images
    )
  `)
  .eq('client_id', user.id)
  .order('created_at', { ascending: false });
```

### RLS Policies

Ja existem as policies necessarias:
- "Clients can view their own quotes" - SELECT
- "Users can view their own profile" - SELECT
- "Users can update their own profile" - UPDATE

Nenhuma migracao necessaria.

---

## Mensagem 3: Melhorias no Admin (Item 3)

### Novas Colunas na Aba "Todos os Usuarios"

| Coluna | Origem |
|--------|--------|
| Nome | profiles.full_name |
| E-mail | profiles.email |
| WhatsApp | profiles.whatsapp |
| Tipo | profiles.role |
| Data Cadastro | profiles.created_at |
| Creditos Disponiveis | vendor_credits (ultimo balance_after) |
| Cotacoes Solicitadas | COUNT(quotes) onde client_id = profile.id |
| Cotacoes Recebidas | COUNT(quotes) onde vendor_id = profile.id |

### Filtros a Implementar

1. **Busca por Email** - Input de texto
2. **Filtro por Data** - Date range picker
3. **Filtro por Cotacoes** - Slider ou input numerico

### Arquivos a Editar

**`src/pages/Admin.tsx`**

Alteracoes:
1. Expandir query para incluir creditos e contagem de cotacoes
2. Adicionar estados para filtros
3. Adicionar componentes de filtro acima da tabela
4. Adicionar novas colunas na tabela

### Query Expandida

```typescript
// Para cada profile, buscar dados adicionais
const profilesWithStats = await Promise.all(
  profilesData.map(async (profile) => {
    // Creditos (apenas fornecedores)
    let credits = 0;
    if (profile.role === 'vendor') {
      const { data: creditData } = await supabase
        .from('vendor_credits')
        .select('balance_after')
        .eq('vendor_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);
      credits = creditData?.[0]?.balance_after || 0;
    }
    
    // Cotacoes solicitadas (clientes)
    const { count: quotesRequested } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', profile.id);
    
    // Cotacoes recebidas (fornecedores)
    const { count: quotesReceived } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', profile.id);
    
    return {
      ...profile,
      credits,
      quotes_requested: quotesRequested || 0,
      quotes_received: quotesReceived || 0,
    };
  })
);
```

---

## Detalhes Tecnicos

### Estrutura de Diretorio Final

```text
src/
├── pages/
│   ├── ClientDashboard.tsx (NOVO)
│   └── Admin.tsx (EDITAR)
├── components/
│   ├── client/
│   │   └── ClientEditProfileModal.tsx (NOVO)
│   └── layout/
│       └── Header.tsx (EDITAR)
└── App.tsx (EDITAR)

supabase/
└── config.toml (EDITAR - site URL)
```

### Item 1 - Status

O Dashboard do Fornecedor ja possui todas as funcionalidades solicitadas:
- Plano contratado (card de assinatura)
- Creditos disponiveis (CreditBalanceCard)
- Cotacoes recebidas (lista com cards)
- Editar perfil (VendorEditProfileModal)
- Usar creditos para desbloquear contatos

**Nenhuma alteracao necessaria.**

### Item 7 - Aguardando

Notificacoes por WhatsApp e Email requerem integracao com API externa.
Aguardando definicao do servico (Resend, Z-API, etc).

---

## Ordem de Execucao

1. **Mensagem 1**: Corrigir bugs (itens 4 e 6) + confirmar traducoes (item 5)
2. **Mensagem 2**: Criar Dashboard do Cliente (item 2)
3. **Mensagem 3**: Melhorar Admin com colunas e filtros (item 3)

Apos cada mensagem, sera feito um teste para validar as alteracoes.
