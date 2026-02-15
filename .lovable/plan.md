

## Corrigir duplicacao do simbolo "$" nos valores monetarios

O problema: a funcao `formatBRL()` ja retorna o valor com "R$" (ex: "R$ 500,00"), mas em alguns locais do codigo ha um icone `DollarSign` antes do valor, criando a exibicao "$ R$ 500,00".

### Arquivos afetados

1. **`src/pages/VendorDashboard.tsx`** (linha 615) — Badge de negocio fechado no painel do fornecedor. Remover o icone `<DollarSign>` mantendo apenas `{formatBRL(dealValue ?? 0)}`.

2. **`src/components/client/ClientProposalCard.tsx`** (linha 106) — Card de proposta no painel do cliente. Remover o icone `<DollarSign>` antes de `{formatBRL(proposedValue)}`.

### O que NAO sera alterado

- Icones `DollarSign` usados como decoracao (sem valor ao lado), como nas abas do Admin e nos relatorios.
- O campo de input no `DealClosedModal.tsx`, onde o icone serve como prefixo de formulario (o usuario digita apenas numeros).

### Estimativa

0 creditos — este ajuste ja foi pago anteriormente.

