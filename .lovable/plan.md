

# Plano: Correção dos Problemas de Exibição e Filtros

## Resumo dos Problemas Identificados

### Problema 1: Rodízio de 4 Fornecedores na Homepage
- **Atual:** A homepage exibe até 20 fornecedores de uma vez
- **Esperado:** Exibir apenas 4 fornecedores ativos em sistema de rodízio (carousel)

### Problema 2: Filtros de Busca Não Funcionam Corretamente
- **Categorias:** O dropdown mostra "Categoria" porque a tabela `categories` está vazia. O sistema usa `VENDOR_CATEGORIES` no código mas busca da tabela vazia
- **Bairros:** Funciona corretamente (Centro, Grama estão sendo retornados)
- **Botão Buscar:** Não existe um botão explícito para acionar a busca

---

## Parte 1: Rodízio de 4 Fornecedores na Homepage

### Modificações em `VendorGrid.tsx`

Implementar um sistema de rodízio automático que:
1. Busca todos os fornecedores ativos
2. Exibe apenas 4 por vez em um carousel
3. Alterna automaticamente a cada 5 segundos
4. Permite navegação manual com setas

```text
+--------------------------------------------------+
|  ← [Card 1] [Card 2] [Card 3] [Card 4] →         |
|     ○ ● ○ ○  (indicadores de posição)            |
+--------------------------------------------------+
```

### Componentes Necessários
- Usar `embla-carousel-react` (já instalado no projeto)
- Adicionar auto-play com intervalo de 5 segundos
- Botões de navegação (anterior/próximo)
- Indicadores de página (dots)

---

## Parte 2: Correção dos Filtros de Busca

### Problema: Categorias Vazias

A página `/buscar` busca categorias da tabela `categories`:
```typescript
const { data } = await supabase
  .from('categories')
  .select('*')
  .eq('is_approved', true);
```

Mas a tabela está vazia. As categorias estão definidas apenas em `lib/constants.ts`.

### Solução: Usar Constantes como Fallback

Modificar `Buscar.tsx` para usar `VENDOR_CATEGORIES` quando a tabela estiver vazia:

```typescript
import { VENDOR_CATEGORIES } from '@/lib/constants';

// No useEffect de categorias:
if (data && data.length > 0) {
  setCategories(data);
} else {
  // Fallback para constantes
  setCategories(VENDOR_CATEGORIES.map(cat => ({
    id: cat.value,
    name: cat.label,
    slug: cat.value,
    emoji: cat.emoji
  })));
}
```

### Adicionar Botão Buscar

Modificar `SearchFilters.tsx` para incluir um botão de busca explícito:

```text
+----------------------------------+
|  🔍 FILTROS                      |
+----------------------------------+
|  📝 Buscar                       |
|  [________________] (input)      |
|                                  |
|  📁 Categoria                    |
|  [🎂 Confeitaria       ▼]        |  ← Agora com lista real
|                                  |
|  📍 Bairro                       |
|  [Centro              ▼]         |  ← Já funciona
|                                  |
|  [     🔍 BUSCAR      ]          |  ← NOVO botão
|                                  |
|  [Limpar filtros]                |
+----------------------------------+
```

---

## Estrutura de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/home/VendorGrid.tsx` | **Modificar** - Carousel com 4 cards + auto-play |
| `src/pages/Buscar.tsx` | **Modificar** - Fallback para VENDOR_CATEGORIES |
| `src/components/search/SearchFilters.tsx` | **Modificar** - Adicionar botão Buscar |

---

## Detalhes Técnicos

### VendorGrid.tsx - Implementação do Carousel

```typescript
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

// Limitar a 4 cards visíveis
const displayedVendors = vendors.slice(0, 4);

// Auto-play a cada 5 segundos
const [emblaRef] = useEmblaCarousel(
  { loop: true, align: 'start' },
  [Autoplay({ delay: 5000 })]
);
```

### SearchFilters.tsx - Botão de Busca

Adicionar callback `onSearch` e botão:

```typescript
interface SearchFiltersProps {
  // ... props existentes
  onSearch: () => void;  // Nova prop
}

// No JSX:
<Button 
  onClick={onSearch}
  className="w-full bg-gradient-orange"
>
  <Search className="mr-2 h-4 w-4" />
  Buscar
</Button>
```

---

## Estimativa de Créditos

| Tarefa | Créditos |
|--------|----------|
| Carousel de 4 vendors na homepage | 2-3 |
| Fallback de categorias | 0.5 |
| Botão Buscar nos filtros | 0.5-1 |
| **Total** | **3-4.5 créditos** |

---

## Comportamento Esperado Após Implementação

### Homepage
- 4 fornecedores visíveis em carousel
- Rotação automática a cada 5 segundos
- Setas para navegação manual
- Filtro por categoria ainda funciona

### Página de Busca
- Dropdown de categorias exibe: Confeitaria, Doces, Salgados, Decoração, Outros
- Dropdown de bairros exibe: Centro, Grama (já funciona)
- Botão "Buscar" explícito para acionar a pesquisa
- Busca também continua funcionando em tempo real ao digitar

