

## Adicionar Avaliação ao Card do Cliente

**Créditos estimados: 1**

### O que será feito

No card "Meus Dados" do painel do cliente (`src/pages/ClientDashboard.tsx`), será adicionada uma seção com estrelas mostrando a avaliação média que o cliente recebeu dos fornecedores, junto com o número de avaliações.

### Alterações

**Arquivo: `src/pages/ClientDashboard.tsx`**

1. Adicionar estado para `avgRating` e `reviewCount`
2. Criar função `fetchClientRating()` que consulta a tabela `reviews` filtrando por `target_id = user.id` e calcula a média e contagem
3. Chamar essa função no `useEffect` quando o usuário estiver carregado
4. Adicionar o componente `StarRating` (já existente) no card de perfil, abaixo dos dados de WhatsApp, mostrando a avaliação média recebida pelos fornecedores

### Detalhes Técnicos

A consulta será:
```sql
SELECT rating FROM reviews WHERE target_id = :userId
```

O cálculo de média será feito no frontend (a tabela reviews é pública para SELECT). O componente `StarRating` de `src/components/ui/star-rating.tsx` será reutilizado com tamanho `md`.

Visualmente, será um novo bloco no card com icone de estrela, label "Avaliação" e o componente StarRating exibindo a média e contagem (ex: "4.5 (3)"). Se não houver avaliações, exibirá "Sem avaliações".

