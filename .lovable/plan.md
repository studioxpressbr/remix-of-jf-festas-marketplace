

# Plano: Adicionar Novas Categorias de Fornecedores

## Resumo

Vou adicionar 11 novas categorias ao sistema JF Festas, mantendo as 5 existentes. As novas categorias são:

| Nova Categoria | Slug | Emoji |
|----------------|------|-------|
| Cerimonialista | cerimonialista | 👰 |
| Personalizados | personalizados | 🎁 |
| Espaço para Festas | espaco | 🏠 |
| Buffet | buffet | 🍽️ |
| Recreação | recreacao | 🎪 |
| Foto e Filme | foto-filme | 📸 |
| Balões | baloes | 🎈 |
| Aluguel | aluguel | 🪑 |
| Churrasqueiro | churrasqueiro | 🍖 |
| Equipes | equipes | 👥 |
| Bar e Bartender | bar | 🍹 |

## Arquivos a Modificar

### 1. Banco de Dados (Migration)
Atualizar o enum `vendor_category` para incluir as novas categorias.

### 2. `src/lib/constants.ts`
Adicionar as novas categorias em `VENDOR_CATEGORIES` e suas cores em `CATEGORY_COLORS`.

### 3. `src/pages/VendorOnboarding.tsx`
Atualizar a validação Zod para aceitar as novas categorias.

### 4. `src/components/vendor/VendorEditProfileModal.tsx`
Atualizar a validação Zod para aceitar as novas categorias.

---

## Detalhes Técnicos

### Migration SQL

```sql
-- Adicionar novos valores ao enum vendor_category
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'cerimonialista';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'personalizados';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'espaco';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'buffet';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'recreacao';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'foto-filme';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'baloes';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'aluguel';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'churrasqueiro';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'equipes';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'bar';
```

### Novas Constantes

```typescript
export const VENDOR_CATEGORIES = [
  { value: 'confeitaria', label: 'Confeitaria', emoji: '🎂' },
  { value: 'doces', label: 'Doces', emoji: '🍬' },
  { value: 'salgados', label: 'Salgados', emoji: '🥟' },
  { value: 'decoracao', label: 'Decoração', emoji: '🎈' },
  { value: 'buffet', label: 'Buffet', emoji: '🍽️' },
  { value: 'cerimonialista', label: 'Cerimonialista', emoji: '👰' },
  { value: 'personalizados', label: 'Personalizados', emoji: '🎁' },
  { value: 'espaco', label: 'Espaço para Festas', emoji: '🏠' },
  { value: 'recreacao', label: 'Recreação', emoji: '🎪' },
  { value: 'foto-filme', label: 'Foto e Filme', emoji: '📸' },
  { value: 'baloes', label: 'Balões', emoji: '🎈' },
  { value: 'aluguel', label: 'Aluguel', emoji: '🪑' },
  { value: 'churrasqueiro', label: 'Churrasqueiro', emoji: '🍖' },
  { value: 'equipes', label: 'Equipes', emoji: '👥' },
  { value: 'bar', label: 'Bar e Bartender', emoji: '🍹' },
  { value: 'outros', label: 'Outros', emoji: '✨' },
] as const;
```

### Validação Zod Atualizada

```typescript
category: z.enum([
  'confeitaria', 'doces', 'salgados', 'decoracao', 
  'buffet', 'cerimonialista', 'personalizados', 'espaco',
  'recreacao', 'foto-filme', 'baloes', 'aluguel',
  'churrasqueiro', 'equipes', 'bar', 'outros'
])
```

---

## Ordem de Execução

1. Criar migration para atualizar o enum no banco
2. Atualizar `constants.ts` com novas categorias e cores
3. Atualizar validação em `VendorOnboarding.tsx`
4. Atualizar validação em `VendorEditProfileModal.tsx`

## Estimativa

1-2 créditos para implementar todas as mudanças.

