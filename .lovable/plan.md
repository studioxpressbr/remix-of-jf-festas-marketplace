

## Ajustes na Funcionalidade de Propostas e Dashboard

### Problema 1: Simbolo "$" duplicado no valor

Nos dois paineis (fornecedor e cliente), o valor do negocio fechado e exibido com `R$ {dealValue?.toFixed(2)}` e na proposta com `R$ {proposedValue.toFixed(2)}`. O metodo `.toFixed(2)` nao formata no padrao brasileiro. Alem disso, o badge de "deal closed" no painel do fornecedor (linha 575) mostra `R$ 750.45` ao inves de `R$ 750,45`.

**Solucao:** Criar uma funcao utilitaria `formatBRL(value: number)` em `src/lib/utils.ts` que usa `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` e aplicar em:
- `VendorDashboard.tsx` (badge de deal closed, linha 575)
- `ClientProposalCard.tsx` (exibicao do valor proposto, linha ~90, e toast de aceitacao)
- Remover o prefixo "R$" hardcoded nesses locais, pois o `Intl.NumberFormat` ja inclui

### Problema 2: Download de contrato nao funciona

A URL do contrato esta salva corretamente no banco (confirmado via query). O componente `ClientProposalCard.tsx` usa um link `<a>` com `target="_blank"`. O problema pode ser:
- O bucket `vendor-contracts` esta configurado como publico, entao a URL deveria funcionar
- O arquivo pode ter sido enviado em ambiente de teste e nao estar acessivel

**Solucao:** Verificar se o link esta sendo renderizado corretamente no componente. Vou tambem adicionar um atributo `download` ao link e melhorar o tratamento de erro caso o arquivo nao esteja disponivel. Adicionalmente, validar que a URL gerada pelo `getPublicUrl` esta correta.

### Problema 3: Campo de proposta mais largo que o modal

O `VendorProposalModal.tsx` usa `DialogContent` com classe `sm:max-w-md`. O campo de input com o container `relative` e o prefixo "R$" pode estar causando overflow. 

**Solucao:** Garantir que o input respeite `w-full` com `overflow-hidden` no container. Revisar se ha algum estilo que faz o campo escapar dos limites do modal. Adicionar `overflow-hidden` ao `DialogContent` se necessario.

### Problema 4: Estrelas do cliente nao aparecem para o fornecedor

Quando o fornecedor desbloqueia um lead, ele ve o nome, WhatsApp e e-mail do cliente, mas nao ve a avaliacao (estrelas) do cliente. Isso e importante para decidir se quer enviar uma proposta.

**Solucao:** No `VendorDashboard.tsx`, ao carregar as cotacoes, buscar tambem as avaliacoes recebidas por cada cliente (`reviews` onde `target_id = client_id`). Exibir o `StarRating` ao lado do nome do cliente na area de contato desbloqueado.

---

### Detalhes Tecnicos

#### Arquivo: `src/lib/utils.ts`
- Adicionar funcao `formatBRL(value: number): string`

#### Arquivo: `src/pages/VendorDashboard.tsx`
- Importar `formatBRL` e `StarRating`
- Na secao de contato desbloqueado (linhas 543-565), adicionar uma linha com `StarRating` mostrando a avaliacao do cliente
- Buscar avaliacoes dos clientes no `fetchData` (query em `reviews` agrupando por `target_id`)
- Substituir `R$ ${dealValue?.toFixed(2)}` por `formatBRL(dealValue)`

#### Arquivo: `src/components/client/ClientProposalCard.tsx`
- Importar `formatBRL`
- Substituir `R$ ${proposedValue.toFixed(2)}` por `formatBRL(proposedValue)` em todos os locais
- Melhorar link de download do contrato

#### Arquivo: `src/components/vendor/VendorProposalModal.tsx`
- Revisar CSS do container do input para evitar overflow

---

### Estimativa de Creditos

| Ajuste | Creditos |
|--------|----------|
| Funcao formatBRL + correcao de exibicao de valores | 0.5 |
| Investigacao e correcao do download de contrato | 0.5 |
| Correcao de layout do modal de proposta | 0.5 |
| Estrelas do cliente vissiveis ao fornecedor | 1.0 |
| **Total** | **2.5** |

