
# Plano: Melhorias no Painel Administrativo

## Resumo das Funcionalidades Solicitadas

### Grupo 1: Navegacao e Filtros do Dashboard
- Cards de estatisticas clicaveis (Fornecedores/Usuarios) que abrem listas em ordem decrescente
- Filtro global de "Cupons Ativos" em todas as abas

### Grupo 2: Gestao de Usuarios
- Desativar usuario (soft-delete - mantém na base como inativo)
- Excluir usuario (hard-delete ou desativacao permanente)

### Grupo 3: Sistema de Creditos Bonus
- Adicionar creditos bonus individuais (5 ou 10 creditos)
- Adicionar creditos bonus em lote (para todos os fornecedores)
- Validade de 10 dias para creditos bonus (expiram apos esse periodo)

### Grupo 4: Sistema de Mensagens Internas
- 5 lembretes pre-configurados editaveis pelo admin
- Mensagens customizadas individuais ou em massa
- Area de notificacoes no dashboard do fornecedor e cliente

---

## Viabilidade Tecnica

Todas as funcionalidades sao viaveis. Segue analise detalhada:

| Funcionalidade | Viavel | Complexidade |
|----------------|--------|--------------|
| Cards clicaveis + listas ordenadas | Sim | Baixa |
| Filtro de cupons ativos | Sim | Baixa |
| Desativar/Excluir usuario | Sim | Media |
| Creditos bonus com validade | Sim | Media-Alta |
| Sistema de mensagens | Sim | Alta |

---

## Grupo 1: Navegacao e Filtros (2-3 creditos)

### Alteracoes em `Admin.tsx`

**Cards clicaveis:**
- Adicionar `onClick` aos cards de estatisticas
- Ao clicar em "Fornecedores": abre aba usuarios com filtro `role=vendor`
- Ao clicar em "Clientes": abre aba usuarios com filtro `role=client`
- Listas ordenadas por `created_at DESC` (mais recentes primeiro)

**Filtro de cupons ativos:**
- Adicionar checkbox "Apenas com cupons ativos"
- Buscar contagem de cupons ativos por fornecedor
- Aplicar filtro em todas as abas

```text
+------------------------------------------+
|  [X] Apenas com cupons ativos            |
+------------------------------------------+
```

### Arquivos Modificados
- `src/pages/Admin.tsx`

---

## Grupo 2: Gestao de Usuarios (3-4 creditos)

### Alteracoes no Banco de Dados

**Nova coluna na tabela `profiles`:**
```sql
ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN deactivated_at timestamptz;
ALTER TABLE profiles ADD COLUMN deactivated_by uuid REFERENCES auth.users(id);
```

### Alteracoes em `Admin.tsx`

**Acoes por usuario na tabela:**
```text
+--------+--------+----------+--------+---------+----------+---------+-----------+
| Nome   | E-mail | WhatsApp | Tipo   | Cadastro| Creditos | Cotacoes| Acoes     |
+--------+--------+----------+--------+---------+----------+---------+-----------+
| Maria  | m@...  | 219...   | Fornec.| 01/02   | 5        | 3       | [⚙️ ▼]    |
+--------+--------+----------+--------+---------+----------+---------+-----------+
                                                             |
                                                             +-> Desativar
                                                             +-> Excluir
                                                             +-> Adicionar Creditos
                                                             +-> Enviar Mensagem
```

**Modal de confirmacao:**
- Desativar: "Deseja desativar este usuario? Ele nao podera acessar a plataforma."
- Excluir: "ATENCAO: Esta acao e irreversivel. Deseja excluir permanentemente?"

### Impacto nas Areas do Fornecedor/Cliente

- Usuarios desativados nao conseguem fazer login
- Fornecedores desativados nao aparecem nas buscas
- Adicionar verificacao de `is_active` no hook `useAuth`

### Arquivos Modificados/Criados
- `supabase/migrations/` - Nova migracao
- `src/pages/Admin.tsx` - Menu de acoes
- `src/components/admin/DeactivateUserModal.tsx` - Novo componente
- `src/hooks/useAuth.tsx` - Verificar status ativo

---

## Grupo 3: Sistema de Creditos Bonus (4-5 creditos)

### Alteracoes no Banco de Dados

**Nova coluna na tabela `vendor_credits`:**
```sql
ALTER TABLE vendor_credits ADD COLUMN expires_at timestamptz;
```

**Nova funcao para calcular saldo disponivel (considera expiracao):**
```sql
CREATE FUNCTION get_vendor_available_balance(p_vendor_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
  v_expired integer;
BEGIN
  -- Calcular creditos expirados que ainda nao foram descontados
  SELECT COALESCE(SUM(amount), 0) INTO v_expired
  FROM vendor_credits
  WHERE vendor_id = p_vendor_id
    AND transaction_type = 'bonus'
    AND expires_at < now()
    AND NOT EXISTS (
      SELECT 1 FROM vendor_credits vc2
      WHERE vc2.vendor_id = p_vendor_id
        AND vc2.transaction_type = 'expiration'
        AND vc2.description LIKE '%' || vendor_credits.id::text || '%'
    );

  -- Obter saldo atual e subtrair expirados
  SELECT COALESCE(balance_after, 0) INTO v_balance
  FROM vendor_credits
  WHERE vendor_id = p_vendor_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN GREATEST(v_balance - v_expired, 0);
END;
$$;
```

### Nova Edge Function: `add-bonus-credits`

```typescript
// Endpoint para admin adicionar creditos bonus
// POST /add-bonus-credits
// Body: { vendorId: string, amount: 5 | 10 } ou { all: true, amount: 5 | 10 }
```

### Alteracoes em `Admin.tsx`

**Modal de adicao de creditos:**
```text
+-------------------------------------------+
| Adicionar Creditos Bonus                  |
+-------------------------------------------+
|                                           |
|  Para: [Fornecedor Especifico ▼]          |
|        ou                                 |
|  [X] Todos os fornecedores ativos         |
|                                           |
|  Quantidade: [5] [10]                     |
|                                           |
|  ℹ️ Creditos bonus expiram em 10 dias     |
|                                           |
|  [Cancelar]              [Adicionar]      |
+-------------------------------------------+
```

### Impacto no Dashboard do Fornecedor

- Exibir creditos com indicador de validade
- Mostrar "X creditos expiram em Y dias" quando houver bonus
- Atualizar `CreditBalanceCard.tsx` para mostrar bonus separadamente

### Arquivos Modificados/Criados
- `supabase/migrations/` - Novas colunas e funcoes
- `supabase/functions/add-bonus-credits/index.ts` - Nova edge function
- `src/pages/Admin.tsx` - Botao e modal de creditos
- `src/components/admin/AddBonusCreditsModal.tsx` - Novo componente
- `src/components/vendor/CreditBalanceCard.tsx` - Mostrar bonus

---

## Grupo 4: Sistema de Mensagens Internas (6-8 creditos)

### Novas Tabelas no Banco de Dados

```sql
-- Templates de mensagens do admin
CREATE TABLE admin_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  shortcut text NOT NULL, -- ex: "/lembrete1"
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mensagens enviadas para usuarios
CREATE TABLE user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id) NOT NULL,
  sender_id uuid REFERENCES auth.users(id), -- null = sistema
  subject text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indices e RLS
CREATE INDEX idx_user_messages_recipient ON user_messages(recipient_id);
CREATE INDEX idx_user_messages_unread ON user_messages(recipient_id) WHERE is_read = false;
```

### Alteracoes em `Admin.tsx`

**Gerenciador de templates (aba nova ou secao):**
```text
+-------------------------------------------+
| Lembretes Rapidos                         |
+-------------------------------------------+
| /lembrete1: "Complete seu cadastro..."    | [Editar]
| /lembrete2: "Seu plano expira em..."      | [Editar]
| /lembrete3: "Responda as cotacoes..."     | [Editar]
| /lembrete4: "Atualize suas fotos..."      | [Editar]
| /lembrete5: "Aproveite o bonus..."        | [Editar]
+-------------------------------------------+
```

**Modal de envio de mensagem:**
```text
+-------------------------------------------+
| Enviar Mensagem                           |
+-------------------------------------------+
|                                           |
|  Para: [Selecionar Usuario ▼]             |
|        ou                                 |
|  [X] Todos os fornecedores                |
|  [X] Todos os clientes                    |
|                                           |
|  Assunto: [___________________________]   |
|                                           |
|  Mensagem:                                |
|  [Usar template: /lembrete1 ▼]            |
|  +-------------------------------------+  |
|  |                                     |  |
|  |                                     |  |
|  +-------------------------------------+  |
|                                           |
|  [Cancelar]              [Enviar]         |
+-------------------------------------------+
```

### Impacto nos Dashboards

**VendorDashboard.tsx e ClientDashboard.tsx:**
- Adicionar icone de notificacao no header
- Badge com contagem de mensagens nao lidas
- Area de caixa de entrada com lista de mensagens

```text
+-------------------------------------------+
| 📬 Mensagens (2 novas)                    |
+-------------------------------------------+
| [●] Bem-vindo ao JF Festas!       | 01/02 |
| [●] Voce ganhou 5 creditos bonus! | 31/01 |
| [ ] Atualize seu perfil           | 28/01 |
+-------------------------------------------+
```

### Arquivos Modificados/Criados
- `supabase/migrations/` - Novas tabelas
- `src/pages/Admin.tsx` - Secao de templates e modal de envio
- `src/components/admin/MessageTemplatesSection.tsx` - Novo componente
- `src/components/admin/SendMessageModal.tsx` - Novo componente
- `src/components/shared/NotificationBell.tsx` - Novo componente
- `src/components/shared/MessagesInbox.tsx` - Novo componente
- `src/pages/VendorDashboard.tsx` - Adicionar notificacoes
- `src/pages/ClientDashboard.tsx` - Adicionar notificacoes

---

## Estimativa de Creditos por Grupo

| Grupo | Funcionalidade | Creditos Estimados |
|-------|----------------|-------------------|
| 1 | Navegacao e Filtros | 2-3 |
| 2 | Gestao de Usuarios | 3-4 |
| 3 | Creditos Bonus com Validade | 4-5 |
| 4 | Sistema de Mensagens | 6-8 |
| **Total** | **Todas as funcionalidades** | **15-20 creditos** |

---

## Ordem de Implementacao Recomendada

1. **Grupo 1** (Navegacao e Filtros) - Base para usar o resto
2. **Grupo 2** (Gestao de Usuarios) - Funcionalidade core de admin
3. **Grupo 3** (Creditos Bonus) - Complementa sistema existente
4. **Grupo 4** (Mensagens) - Funcionalidade mais complexa

---

## Consideracoes de Segurança

- Todas as acoes de admin verificadas via `has_admin_role()`
- RLS restritivo em `user_messages` (usuarios so veem proprias mensagens)
- Logs de acoes administrativas para auditoria
- Edge functions usam `SUPABASE_SERVICE_ROLE_KEY` para operacoes privilegiadas
