

## Correção Visual do Filtro de Busca

**Créditos estimados: 1**

### Problema

A barra lateral de filtros não tem z-index definido, fazendo com que elementos dos cards de fornecedores (estrelas de avaliação, texto "3.0") apareçam sobrepostos ao filtro de avaliação. O slider também precisa de mais espaçamento para evitar sobreposição visual.

### Correções

**Arquivo: `src/components/search/SearchFilters.tsx`**

1. Adicionar `z-10` e `overflow-hidden` ao container `aside` da sidebar (desktop) para garantir que o conteúdo dos cards não sangre visualmente por cima dos filtros
2. Adicionar `relative` ao container do slider de avaliação para isolar o contexto de empilhamento
3. Aumentar o padding inferior do bloco de avaliação para dar mais respiro visual ao slider e aos labels "Qualquer / 5 estrelas"

### Detalhes Técnicos

Na tag `<aside>` (linha ~199), adicionar classes `z-10 overflow-hidden` ao className existente:

```
className="sticky top-4 z-10 h-fit w-72 shrink-0 overflow-hidden rounded-lg border bg-card p-4 shadow-soft"
```

No bloco do slider de avaliação (linha ~147), adicionar `relative` ao container e aumentar padding:

```
<div className="relative space-y-3 pb-4">
```

