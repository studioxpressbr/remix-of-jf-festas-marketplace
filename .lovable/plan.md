
# Plano: Filtros Avançados de Busca de Fornecedores

## Resumo

Implementar sistema completo de filtros na página de busca (`/buscar`) que permite usuários (logados ou não) filtrar fornecedores por:
- Categoria
- Palavra-chave (nome, descrição)
- Bairro
- Cupons disponíveis
- Classificação/Avaliação (estrelas 0-5)

---

## Análise do Estado Atual

### Dados Existentes no Banco
- **Bairros cadastrados:** Centro, Grama
- **Cupons:** Nenhum ativo no momento (tabela existe)
- **Reviews:** Nenhuma avaliação cadastrada (tabela existe com campo `rating` 0-5)
- **Categorias:** Confeitaria, Doces, Salgados, Decoração, Outros

### Arquivos Principais
- `src/pages/Buscar.tsx` - Página de busca atual
- `src/components/home/VendorCard.tsx` - Card do fornecedor

---

## Parte 1: Atualização do Banco de Dados

### Nova View SQL com Dados Agregados

Criar nova view `vendors_search` que inclui contagem de cupons e média de avaliação:

```sql
CREATE OR REPLACE VIEW public.vendors_search AS
SELECT 
  v.id,
  v.profile_id,
  v.business_name,
  v.category,
  v.custom_category,
  v.description,
  v.neighborhood,
  v.images,
  v.created_at,
  v.subscription_status,
  v.is_approved,
  v.approved_at,
  v.category_id,
  COALESCE(
    (SELECT COUNT(*) FROM coupons c 
     WHERE c.vendor_id = v.id 
     AND c.is_active = true 
     AND c.expires_at > NOW()
     AND (c.max_uses IS NULL OR c.current_uses < c.max_uses)
    ), 0
  )::integer AS active_coupons_count,
  COALESCE(
    (SELECT AVG(r.rating)::numeric(2,1) FROM reviews r WHERE r.target_id = v.profile_id), 0
  ) AS avg_rating,
  COALESCE(
    (SELECT COUNT(*) FROM reviews r WHERE r.target_id = v.profile_id), 0
  )::integer AS review_count
FROM vendors v
WHERE v.is_approved = true 
  AND (
    v.subscription_status = 'active' 
    OR v.approved_at > NOW() - INTERVAL '24 hours'
  );
```

---

## Parte 2: Componente de Filtros

### Novo Componente: `src/components/search/SearchFilters.tsx`

Painel lateral/colapsável com os filtros:

```
+----------------------------------+
|  🔍 FILTROS                      |
+----------------------------------+
|                                  |
|  📝 Buscar                       |
|  [________________] (input)      |
|                                  |
|  📁 Categoria                    |
|  [Selecione...        ▼]         |
|                                  |
|  📍 Bairro                       |
|  [Todos os bairros    ▼]         |
|                                  |
|  🎟️ Cupons                       |
|  [ ] Apenas com cupons           |
|                                  |
|  ⭐ Avaliação mínima             |
|  ☆☆☆☆☆  (0 estrelas)            |
|  [=====○-----------]  slider     |
|                                  |
|  [Limpar Filtros]                |
+----------------------------------+
```

**Props do componente:**

```typescript
interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (n: string) => void;
  hasCoupons: boolean;
  setHasCoupons: (v: boolean) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  neighborhoods: string[];
  categories: Category[];
  onClearFilters: () => void;
}
```

---

## Parte 3: Componente de Estrelas

### Novo Componente: `src/components/ui/star-rating.tsx`

Componente reutilizável para exibir avaliações:

```typescript
interface StarRatingProps {
  rating: number;      // 0-5
  showValue?: boolean; // Mostrar "4.5" ao lado
  size?: 'sm' | 'md' | 'lg';
}
```

Visual: ★★★★☆ (4.2)

---

## Parte 4: Atualização da Página de Busca

### Modificações em `src/pages/Buscar.tsx`

1. **Novos estados:**
```typescript
const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
const [hasCoupons, setHasCoupons] = useState(false);
const [minRating, setMinRating] = useState(0);
const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
```

2. **Buscar bairros únicos:**
```typescript
useEffect(() => {
  async function fetchNeighborhoods() {
    const { data } = await supabase
      .from('vendors_search')
      .select('neighborhood')
      .not('neighborhood', 'is', null);
    
    const unique = [...new Set(data?.map(v => v.neighborhood))];
    setNeighborhoods(unique.filter(Boolean));
  }
  fetchNeighborhoods();
}, []);
```

3. **Query com todos os filtros:**
```typescript
let query = supabase
  .from('vendors_search')
  .select('*');

// Palavra-chave
if (searchTerm) {
  query = query.or(`business_name.ilike.%${term}%,description.ilike.%${term}%`);
}

// Categoria
if (selectedCategory) {
  query = query.eq('category', selectedCategory);
}

// Bairro
if (selectedNeighborhood) {
  query = query.eq('neighborhood', selectedNeighborhood);
}

// Cupons
if (hasCoupons) {
  query = query.gt('active_coupons_count', 0);
}

// Avaliação mínima
if (minRating > 0) {
  query = query.gte('avg_rating', minRating);
}
```

4. **Layout responsivo:**
```
Desktop: Filtros à esquerda | Resultados à direita
Mobile: Filtros em drawer colapsável no topo
```

---

## Parte 5: Atualização do VendorCard

### Modificações em `src/components/home/VendorCard.tsx`

1. **Adicionar novos campos à interface:**
```typescript
interface Vendor {
  // ... campos existentes
  active_coupons_count?: number;
  avg_rating?: number;
  review_count?: number;
}
```

2. **Exibir badges no card:**
- Badge de cupom: 🎟️ quando `active_coupons_count > 0`
- Estrelas: ★4.5 (12) quando houver avaliações

---

## Parte 6: URL Params

Todos os filtros serão sincronizados com a URL para compartilhamento:

```
/buscar?q=bolo&categoria=confeitaria&bairro=Centro&cupons=1&avaliacao=4
```

---

## Estrutura de Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/xxx.sql` | **Criar** - View `vendors_search` |
| `src/components/search/SearchFilters.tsx` | **Criar** - Painel de filtros |
| `src/components/ui/star-rating.tsx` | **Criar** - Componente de estrelas |
| `src/pages/Buscar.tsx` | **Modificar** - Integrar filtros |
| `src/components/home/VendorCard.tsx` | **Modificar** - Exibir rating e cupons |
| `src/integrations/supabase/types.ts` | **Atualizado automaticamente** |

---

## Fluxo Visual (Desktop)

```
+------------------+----------------------------------------+
| FILTROS          | RESULTADOS                             |
|                  |                                        |
| 🔍 Buscar        | 3 fornecedores encontrados             |
| [bolo________]   |                                        |
|                  | +--------+  +--------+  +--------+     |
| 📁 Categoria     | | 🎂     |  | 🍰     |  | 🧁     |     |
| [Confeitaria ▼]  | | Maria  |  | João   |  | Ana    |     |
|                  | | ★★★★☆  |  | ★★★★★  |  | ★★★☆☆  |     |
| 📍 Bairro        | | 🎟️     |  |        |  | 🎟️     |     |
| [Centro      ▼]  | +--------+  +--------+  +--------+     |
|                  |                                        |
| 🎟️ Cupons        |                                        |
| [✓] Com cupom    |                                        |
|                  |                                        |
| ⭐ Avaliação     |                                        |
| [====○-----]     |                                        |
| Mínimo: 3 ⭐     |                                        |
|                  |                                        |
| [Limpar filtros] |                                        |
+------------------+----------------------------------------+
```

---

## Estimativa de Créditos

| Etapa | Créditos |
|-------|----------|
| Migration SQL (view) | ~1-2 |
| SearchFilters.tsx | ~2-3 |
| StarRating.tsx | ~1 |
| Buscar.tsx (modificações) | ~2-3 |
| VendorCard.tsx (modificações) | ~1-2 |
| Testes e ajustes | ~1-2 |
| **Total estimado** | **8-13 créditos** |

---

## Considerações Técnicas

1. **Performance:** A view `vendors_search` usa subqueries que são executadas por linha. Para grande volume de dados, considerar materialização ou colunas calculadas.

2. **RLS:** A view herda a visibilidade da tabela `vendors` - não expõe dados sensíveis.

3. **Cupons futuros:** O filtro já está preparado para quando cupons forem cadastrados.

4. **Reviews futuras:** O filtro de avaliação mostrará "sem avaliações" quando `review_count = 0`.

5. **Mobile-first:** O painel de filtros será colapsável em telas pequenas.
