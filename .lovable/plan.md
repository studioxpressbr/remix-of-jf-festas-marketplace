

## Prioridade 3: Historico de Mensagens Admin + Prioridade 4: Melhorias de UX

**Creditos estimados: 2-3**

---

### PRIORIDADE 3: Historico de Mensagens do Admin (1 credito)

A aba "Mensagens" do painel admin atualmente mostra apenas os templates editaveis. Vamos expandir para incluir o historico de mensagens enviadas.

**Alteracoes:**

1. **Novo componente `SentMessagesSection`** - Sub-secao na aba "Mensagens" que lista as ultimas mensagens enviadas pelo admin, com:
   - Tabela mostrando: destinatario, assunto, data de envio, status (lida/nao lida)
   - Filtro por tipo de destinatario (fornecedor/cliente)
   - Paginacao simples (ultimas 50 mensagens)

2. **Atualizar `MessageTemplatesSection`** - Manter como esta, apenas reorganizar layout

3. **Atualizar aba "Mensagens" em `Admin.tsx`** - Renderizar ambas as secoes (templates + historico)

4. **Contagem de mensagens nao lidas na aba "Usuarios"** - Adicionar ao `fetchData` uma consulta para contar mensagens nao lidas por usuario e exibir um badge na coluna de acoes

**Arquivos afetados:**
- `src/components/admin/SentMessagesSection.tsx` (novo)
- `src/pages/Admin.tsx` (atualizar aba mensagens + badge de nao lidas)

---

### PRIORIDADE 4: Melhorias Gerais de UX (1-2 creditos)

#### 4.1 - Ordenacao de resultados na busca
Adicionar opcoes de ordenacao na pagina `/buscar`:
- Mais recentes (padrao atual)
- Melhor avaliacao
- Com cupons ativos primeiro

**Arquivos afetados:**
- `src/components/search/SearchFilters.tsx` (novo select de ordenacao)
- `src/pages/Buscar.tsx` (logica de sort)

#### 4.2 - Feedback visual de status no dashboard do fornecedor
Adicionar um banner no topo do dashboard indicando:
- "Seu perfil esta visivel na plataforma" (aprovado + assinatura ativa) - verde
- "Seu perfil esta oculto" (assinatura inativa ou nao aprovado) - amarelo/vermelho
- Motivo especifico (pendente de aprovacao, assinatura expirada, etc.)

**Arquivos afetados:**
- `src/pages/VendorDashboard.tsx` (adicionar banner de status)

#### 4.3 - Meta tags dinamicas para SEO nos perfis de fornecedores
Atualizar o `document.title` e meta description dinamicamente na pagina de perfil do fornecedor usando o slug e nome da empresa.

**Arquivos afetados:**
- `src/pages/VendorProfile.tsx` (useEffect para meta tags)

---

### Detalhes Tecnicos

**Consulta para historico de mensagens (SentMessagesSection):**
```text
SELECT um.*, p.full_name, p.role
FROM user_messages um
JOIN profiles p ON p.id = um.recipient_id
WHERE um.sender_id = <admin_user_id>
ORDER BY um.created_at DESC
LIMIT 50
```
- O admin ja tem politica de SELECT em `user_messages` e `profiles`
- Nao e necessario criar migracao SQL

**Consulta para contagem de nao lidas por usuario:**
```text
SELECT recipient_id, COUNT(*) as unread_count
FROM user_messages
WHERE is_read = false
GROUP BY recipient_id
```

**Ordenacao na busca:**
- Implementada no frontend via `query.order()` do Supabase
- `avg_rating DESC` para melhor avaliacao
- `active_coupons_count DESC NULLS LAST` para cupons primeiro

---

### Cronograma

| Ordem | Item | Creditos |
|-------|------|----------|
| 1 | Historico de mensagens admin + badge nao lidas | 1 |
| 2 | Ordenacao na busca + banner de status + meta tags SEO | 1-2 |
| **Total** | | **2-3** |

