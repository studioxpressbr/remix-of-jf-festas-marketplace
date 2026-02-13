
## Correções no Filtro de Busca

### Problemas Identificados

1. **"Limpar filtros" nao re-executa a busca** - Ao clicar em "Limpar filtros", os campos do formulario sao resetados, mas a busca nao e re-executada. O usuario precisa clicar "Buscar" manualmente novamente, o que causa confusao pois os resultados antigos permanecem na tela com filtros limpos.

2. **Busca nao e automatica ao mudar filtros** - O usuario precisa sempre clicar no botao "Buscar" para aplicar qualquer alteracao. A experiencia ideal seria buscar automaticamente ao selecionar categoria, bairro ou checkbox de cupons (com debounce para o campo de texto).

3. **Estado inicial de categoria/bairro inconsistente** - Os selects usam `'all'` como valor para "todos", mas o estado inicial e `''` (string vazia). Isso causa inconsistencia na logica de comparacao.

4. **Rating "2.0" exibido sem contexto** - Abaixo do slider de avaliacao aparece "2.0" que parece ser um artefato visual de um vendor card parcialmente visivel, mas a area do slider pode ser confusa.

### Solucao Proposta

**Arquivo: `src/pages/Buscar.tsx`**

- Alterar `clearFilters()` para chamar `searchVendors()` apos resetar os estados (usando um flag ou chamando diretamente)
- Mudar os estados iniciais de `selectedCategory` e `selectedNeighborhood` de `''` para `'all'` quando nao ha parametro de URL
- Tornar a busca automatica: remover o botao "Buscar" obrigatorio e aplicar filtros em tempo real (com debounce de 300ms para o campo de texto)
- Remover a logica de `shouldSearch` que e desnecessariamente complexa e substituir por um `useEffect` que reage as mudancas de filtros

**Arquivo: `src/components/search/SearchFilters.tsx`**

- Permitir busca ao pressionar Enter no campo de texto
- Manter o botao "Buscar" como atalho visual, mas nao como unica forma de buscar

### Detalhes Tecnicos

As alteracoes principais serao em `src/pages/Buscar.tsx`:

1. Remover `shouldSearch` state e o `useEffect` associado
2. Usar um `useEffect` com dependencias nos filtros (categoria, bairro, cupons, rating) para buscar automaticamente quando esses mudam
3. Adicionar debounce de 300ms no `searchTerm` usando um `useEffect` + `setTimeout`
4. Na funcao `clearFilters()`, resetar os valores para `'all'` (em vez de `''`) e disparar a busca imediatamente
5. Remover a duplicacao de logica de URL params entre o `useEffect` e `handleSearch`

Em `src/components/search/SearchFilters.tsx`:
1. Adicionar `onKeyDown` no Input para disparar busca ao pressionar Enter
2. Manter botao "Buscar" como opcao alternativa

A busca continuara usando a view `vendors_search` com os mesmos filtros existentes (ilike para texto, eq para categoria/bairro, gte para rating, not null + gte para cupons).
