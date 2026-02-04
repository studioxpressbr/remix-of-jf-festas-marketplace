

# Plano: Melhorias no Dashboard do Fornecedor

## Resumo Executivo

Implementar funcionalidades pendentes no painel do fornecedor conforme lista de requisitos, organizadas por prioridade e complexidade.

---

## Analise do Estado Atual

### Funcionalidades Implementadas

| Funcionalidade | Status | Arquivo Principal |
|----------------|--------|-------------------|
| Nome (fantasia) | OK | VendorOnboarding.tsx, VendorEditProfileModal.tsx |
| Bairro | OK | VendorOnboarding.tsx, VendorEditProfileModal.tsx |
| Categoria | OK | VendorOnboarding.tsx, VendorEditProfileModal.tsx |
| Descricao | OK | VendorOnboarding.tsx, VendorEditProfileModal.tsx |
| Ate 5 imagens | OK | ImageUpload.tsx (max 5MB cada) |
| Selecionar imagem de perfil | OK | Primeira imagem = capa |
| Editar descricao e imagens | OK | VendorEditProfileModal.tsx (reseta para pending) |
| Ver clientes liberados para cotacao | OK | VendorDashboard.tsx (lista quotes + leads_access) |
| Pagar plano anual | OK | VendorDashboard.tsx via Stripe |
| Comprar creditos | OK | CreditBalanceCard.tsx via Stripe |
| Ver plano atual | OK | VendorDashboard.tsx (subscription_status) |
| Ver data de expiracao | **PARCIAL** | Existe no banco mas nao exibida |

### Funcionalidades Pendentes

| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Inserir e excluir cupons de desconto | PENDENTE | Alta |
| Indicar negocio fechado + valor | PENDENTE | Alta |
| Classificar clientes que fecharam (0-5 estrelas) | PENDENTE | Alta |
| Exibir data de expiracao do plano | PENDENTE | Baixa |
| Excluir perfil | PENDENTE | Media |

---

## Parte 1: Exibir Data de Expiracao do Plano (Baixa Complexidade)

### Modificacoes em VendorDashboard.tsx

Adicionar exibicao da data de expiracao no card de assinatura:

```
+--------------------------------------------------+
| [Crown] Maria Festere                            |
| Assinatura ativa                                 |
| Valido ate: 15 de fevereiro de 2027              |
+--------------------------------------------------+
```

**Estimativa: 0.5 credito**

---

## Parte 2: Gestao de Cupons (Alta Complexidade)

### Novo Componente: VendorCouponsSection.tsx

Secao no dashboard para gerenciar cupons:

```
+--------------------------------------------------+
| MEUS CUPONS                           [+ Novo]   |
+--------------------------------------------------+
| DESCONTO10     | 10%  | Expira: 10/02 | [Excluir]|
| PROMO50        | R$50 | Expira: 08/02 | [Excluir]|
+--------------------------------------------------+
| (Cupons expiram em 7 dias automaticamente)       |
+--------------------------------------------------+
```

### Novo Modal: VendorCouponModal.tsx

Formulario para criar cupons:
- Codigo do cupom (texto, unico)
- Tipo de desconto: Fixo (R$) ou Percentual (%)
- Valor do desconto
- Limite de usos (opcional)

### Validacoes

- Codigo unico por fornecedor
- Valor positivo
- Expiracao automatica de 7 dias

### Banco de Dados

A tabela `coupons` ja existe com os campos necessarios:
- `code`, `discount_type`, `discount_value`, `expires_at`, `max_uses`, `current_uses`, `is_active`, `vendor_id`

**Estimativa: 3-4 creditos**

---

## Parte 3: Indicar Negocio Fechado (Alta Complexidade)

### Atualizacoes Necessarias

1. **Nova coluna na tabela `leads_access`:**
   - `deal_closed`: boolean (default false)
   - `deal_value`: numeric (nullable)
   - `deal_closed_at`: timestamp (nullable)

2. **Atualizacao do VendorDashboard.tsx:**
   - Adicionar botao "Fechei o negocio" para leads desbloqueados
   - Modal para informar valor do negocio

### Fluxo Visual

```
+--------------------------------------------------+
| COTACAO - Joao Silva                             |
| 15 de marco | 50 pessoas                         |
| Tel: (32) 99999-0000 | email@example.com         |
+--------------------------------------------------+
| [Badge: Liberado]                                |
| [Fechei o negocio] [Avaliar cliente]             |
+--------------------------------------------------+
```

Apos clicar em "Fechei o negocio":

```
+-----------------------------+
| Qual foi o valor do negocio?|
| R$ [__________]             |
| [Cancelar] [Confirmar]      |
+-----------------------------+
```

**Estimativa: 2-3 creditos**

---

## Parte 4: Classificar Clientes (Media Complexidade)

### Regra de Negocio

- Fornecedor pode avaliar cliente **apenas apos indicar que fechou o negocio**
- Ou quando `deal_closed = true`
- Avaliacao de 0-5 estrelas com comentario opcional

### Modificacoes

1. **Banco de Dados:**
   - A tabela `reviews` ja existe
   - Usar `reviewer_id` = fornecedor, `target_id` = cliente
   - Adicionar verificacao: apenas para quotes com `deal_closed = true`

2. **Novo Componente: VendorReviewClientModal.tsx**
   - Selecao de estrelas (1-5)
   - Comentario opcional (max 500 caracteres)
   - Validacao: apenas 1 review por quote

### Fluxo

```
+--------------------------------------------------+
| COTACAO - Joao Silva        [Negocio: R$ 500]    |
| [Avaliar cliente]                                |
+--------------------------------------------------+
          |
          v
+-----------------------------+
| Avalie o cliente            |
| [*][*][*][*][ ]  4 estrelas |
| Comentario (opcional):      |
| [_________________________] |
| [Cancelar] [Enviar]         |
+-----------------------------+
```

**Estimativa: 2-3 creditos**

---

## Parte 5: Excluir Perfil (Media Complexidade)

### Fluxo

1. Botao "Excluir minha conta" nas configuracoes
2. Modal de confirmacao com alerta sobre consequencias
3. Digitacao de confirmacao ("EXCLUIR")
4. Soft delete ou hard delete (a definir)

### Consideracoes

- **Soft delete**: Manter dados para auditoria, apenas desativar
- **Hard delete**: Remover todos os dados (LGPD compliance)
- Cascade: quotes, leads_access, vendor_credits, coupons, reviews

### Componentes

1. **Nova secao no VendorDashboard.tsx:** Area de "Configuracoes da Conta"
2. **Novo Modal: DeleteAccountModal.tsx**

### Fluxo Visual

```
+--------------------------------------------------+
| ZONA DE PERIGO                                   |
+--------------------------------------------------+
| [Excluir minha conta] (vermelho)                 |
| Esta acao e irreversivel e removera todos os    |
| seus dados da plataforma.                        |
+--------------------------------------------------+
```

Modal de confirmacao:

```
+-----------------------------+
| ATENCAO: Acao Irreversivel  |
| Voce perdera:               |
| - Todas as cotacoes         |
| - Historico de creditos     |
| - Cupons ativos             |
|                             |
| Digite EXCLUIR para         |
| confirmar:                  |
| [__________]                |
| [Cancelar] [Excluir conta]  |
+-----------------------------+
```

**Estimativa: 2-3 creditos**

---

## Estrutura de Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx.sql` | Criar - Campos deal_closed em leads_access |
| `src/components/vendor/VendorCouponsSection.tsx` | Criar |
| `src/components/vendor/VendorCouponModal.tsx` | Criar |
| `src/components/vendor/VendorReviewClientModal.tsx` | Criar |
| `src/components/vendor/DeleteAccountModal.tsx` | Criar |
| `src/components/vendor/DealClosedModal.tsx` | Criar |
| `src/pages/VendorDashboard.tsx` | Modificar - Integrar novas secoes |

---

## Resumo das Modificacoes no Dashboard

```
+==================================================+
| PAINEL DO FORNECEDOR                             |
+==================================================+
|                                                  |
| [Card Assinatura]         [Card Creditos]        |
| - Status ativo/inativo    - Saldo atual          |
| - Data de expiracao       - Extrato              |
| - Botao Ativar/Renovar    - Comprar creditos     |
|                                                  |
+--------------------------------------------------+
| MEUS CUPONS                           [+ Novo]   |
| - Lista de cupons ativos                         |
| - Criar/Excluir cupons                           |
+--------------------------------------------------+
| COTACOES RECEBIDAS                               |
| - Lista de cotacoes                              |
| - Liberar contato (usar credito)                 |
| - Marcar negocio fechado + valor                 |
| - Avaliar cliente (apos fechar)                  |
+--------------------------------------------------+
| CONFIGURACOES                                    |
| - Editar contato                                 |
| - Editar perfil comercial                        |
| - Excluir conta                                  |
+--------------------------------------------------+
```

---

## Estimativa Total de Creditos

| Funcionalidade | Creditos Estimados |
|----------------|-------------------|
| Exibir data de expiracao | 0.5 |
| Gestao de cupons | 3-4 |
| Indicar negocio fechado | 2-3 |
| Classificar clientes | 2-3 |
| Excluir perfil | 2-3 |
| Testes e ajustes | 1-2 |
| **Total** | **10-15 creditos** |

---

## Ordem de Implementacao Sugerida

1. **Fase 1 (Rapida):** Exibir data de expiracao
2. **Fase 2:** Gestao de cupons (funcionalidade comercial importante)
3. **Fase 3:** Indicar negocio fechado + Classificar clientes (dependem um do outro)
4. **Fase 4:** Excluir perfil (menor prioridade)

---

## Consideracoes Tecnicas

1. **RLS:** Novas operacoes em coupons respeitam politicas existentes (vendor pode gerenciar proprios cupons)

2. **Reviews bidirecional:** A tabela reviews suporta tanto cliente avaliar fornecedor quanto fornecedor avaliar cliente

3. **Cascade ao deletar:** Necessario definir comportamento de FK constraints antes de implementar exclusao

4. **Soft delete vs Hard delete:** Recomendo soft delete (adicionar campo `deleted_at`) para compliance e auditoria

