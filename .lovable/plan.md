

# Plano: Página Interna do Cliente (Dashboard do Cliente)

## Resumo

Criar uma nova página de dashboard para clientes com as seguintes funcionalidades:
- Visualizar cotações solicitadas
- Editar perfil (nome, WhatsApp, email)

---

## Estrutura de Arquivos

```text
src/
├── pages/
│   └── ClientDashboard.tsx (NOVO)
└── components/
    └── client/
        └── ClientEditProfileModal.tsx (NOVO)
```

---

## Implementacao

### 1. Criar Modal de Edicao de Perfil do Cliente

Arquivo: `src/components/client/ClientEditProfileModal.tsx`

Campos editaveis:
- Nome completo
- WhatsApp  
- Email

Diferenca do modal do fornecedor: nao requer re-aprovacao, salva imediatamente.

### 2. Criar Pagina do Dashboard do Cliente

Arquivo: `src/pages/ClientDashboard.tsx`

Layout:
```text
+------------------------------------------+
|  Header                                   |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | Meu Perfil             [Editar]   |  |
|  | Nome: Cliente                      |  |
|  | Email: cliente@email.com          |  |
|  | WhatsApp: (32) 99999-9999         |  |
|  +------------------------------------+  |
|                                          |
|  Minhas Cotacoes                         |
|  +------------------------------------+  |
|  | Fornecedor: Doces da Maria        |  |
|  | Data: 15 de Marco                 |  |
|  | Pessoas: 50                       |  |
|  | Status: Em aberto                 |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | Fornecedor: Salgados do Joao      |  |
|  | ...                               |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

Funcionalidades:
- Verificar se usuario esta logado e tem role 'client'
- Buscar cotacoes do cliente com dados do fornecedor
- Mostrar status de cada cotacao (open, responded, etc.)
- Botao para editar perfil

### 3. Atualizar Rotas no App.tsx

Adicionar nova rota:
```
/minha-conta -> ClientDashboard
```

### 4. Atualizar Header

Adicionar link "Minha Conta" para clientes logados (role === 'client') no menu de navegacao.

---

## Detalhes Tecnicos

### Query de Cotacoes do Cliente

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

### RLS Policies Necessarias

Ja existem as policies adequadas:
- "Clients can view their own quotes" - permite SELECT onde auth.uid() = client_id
- "Clients can update their own quotes" - permite UPDATE
- "Users can view their own profile" - permite SELECT do proprio perfil
- "Users can update their own profile" - permite UPDATE do proprio perfil

Nao e necessario criar novas policies.

### Componentes Reutilizados

- Card, CardContent do shadcn/ui
- Badge para status
- Button para acoes
- Dialog para modal de edicao
- Form components do react-hook-form
- Header existente
- AuthProvider/useAuthContext

---

## Fluxo do Usuario

1. Cliente faz login
2. Aparece opcao "Minha Conta" no header
3. Ao clicar, vai para /minha-conta
4. Ve seu perfil e lista de cotacoes enviadas
5. Pode editar nome, WhatsApp ou email clicando em "Editar"
6. Alteracoes sao salvas imediatamente

