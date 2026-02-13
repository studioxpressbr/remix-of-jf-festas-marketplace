
## Investigação e Correção: Formatação de Moeda e Download de Contrato

### Problema 1: Formatação de Moeda no Toast do VendorProposalModal (Linha 152)

**Situação:**
- Na linha 152 do `VendorProposalModal.tsx`, o toast exibe: `Proposta de R$ ${numericValue.toFixed(2)} enviada para ${clientName}.`
- Usa `.toFixed(2)` que formata como "1000.50" em vez do padrão brasileiro "1.000,50"
- O `formatBRL` foi implementado em `src/lib/utils.ts`, mas não está sendo usado aqui

**Correção:**
- Importar `formatBRL` de `src/lib/utils`
- Substituir `R$ ${numericValue.toFixed(2)}` por `formatBRL(numericValue)`
- Remover o prefixo "R$" hardcoded, pois `formatBRL` já inclui o símbolo R$

---

### Problema 2: Download de Contrato Não Funciona

**Investigação:**
1. **URL Geração (VendorProposalModal.tsx, linhas 129-133):**
   - Usa `supabase.storage.from('vendor-contracts').getPublicUrl(fileName)`
   - Bucket `vendor-contracts` está configurado como público (migrations)
   - Política de storage permite que "Anyone can view contracts" (SELECT)
   - A URL é salva no banco de dados corretamente

2. **Link de Download (ClientProposalCard.tsx, linhas 121-132):**
   - Usa `<a href={contractUrl} target="_blank" download>`
   - `download` attribute está presente
   - Mas o atributo `download` funciona **apenas se o servidor retornar `Content-Disposition: attachment`**

**Raiz do Problema:**
- `getPublicUrl()` gera uma URL pública (ex: `https://...storage.supabase.co/object/public/vendor-contracts/...`)
- Esse tipo de URL **sem parametrização de download** será servida inline pelo navegador (com `Content-Type: application/pdf` ou `application/msword`)
- O atributo `download` no `<a>` tag não força o download em URLs para buckets públicos diretos
- Além disso, URLpúblicas podem ter issues de expiração ou restrições de CORS

**Solução Recomendada:**
Criar uma Edge Function `download-contract` que:
1. Valida se o usuário autenticado tem acesso ao contrato (é cliente ou vendor da quote)
2. Faz download do arquivo via `supabase.storage.download()` com Authorization header
3. Retorna o arquivo com header `Content-Disposition: attachment; filename="..."`
4. Garante que RLS e permissões sejam respeitadas

Alternativa (menos robusta):
- Usar `supabase.storage.from('vendor-contracts').download(path)` no client-side, mas isso viola RLS

**Implementação:**

#### 1. Nova Edge Function: `download-contract`
```typescript
// supabase/functions/download-contract/index.ts
- Recebe: { quoteId: string }
- Valida acesso (cliente ou vendor da quote)
- Faz download do arquivo via service role
- Retorna com headers corretos para força download
```

#### 2. Atualizar ClientProposalCard.tsx
```typescript
- Ao invés de link direto, usar botão que chama a Edge Function
- Isso garante validação de acesso + headers corretos de download
```

---

### Sequência de Implementação

1. **Corrigir formatação de moeda no VendorProposalModal.tsx (linha 152)**
   - Importar `formatBRL`
   - Substituir `R$ ${numericValue.toFixed(2)}` por `formatBRL(numericValue)`

2. **Criar Edge Function `download-contract`**
   - Validar acesso do usuário ao contrato
   - Fazer download com headers corretos

3. **Atualizar ClientProposalCard.tsx**
   - Substituir `<a>` por `<Button>` que chama a Edge Function
   - Adicionar loading state durante download

---

### Créditos Devidos

Sim, o usuário tem razão. As implementações anteriores foram incompletas:
- ✗ Formatação de moeda no toast: não foi corrigida
- ✗ Download de contrato: foi apenas adicionado `download` attribute (superficial), sem resolver a causa raiz

Essas correções devem ter sido contabilizadas nos créditos anteriores, mas não foram executadas corretamente.

