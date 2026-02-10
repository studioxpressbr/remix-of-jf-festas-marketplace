

## Relatorio de Negocios Fechados no Painel Admin

### Objetivo

Adicionar uma nova aba "Negocios" no painel administrativo (`/gestao/admin`) com um relatorio completo de negocios fechados pelos fornecedores, permitindo ao admin:

1. Visualizar ranking de fornecedores por volume de negocios fechados
2. Filtrar por periodo (mes, intervalo personalizado)
3. Ver totais agregados (quantidade de negocios e valor total por fornecedor)
4. Bonificar fornecedores diretamente a partir do ranking (botao para dar creditos bonus)

### Creditos estimados: ~1 credito

### Detalhes tecnicos

**1. Nova aba "Negocios" em `src/pages/Admin.tsx`**

Adicionar uma quarta aba no `TabsList` com icone `DollarSign` e titulo "Negocios".

**2. Busca de dados**

Na funcao `fetchData()`, adicionar uma query ao `leads_access`:

```sql
SELECT la.vendor_id, la.deal_value, la.deal_closed_at, la.quote_id,
       p.full_name, p.email
FROM leads_access la
JOIN profiles p ON p.id = la.vendor_id
WHERE la.deal_closed = true
```

Os dados serao agrupados no frontend por `vendor_id` para calcular:
- Total de negocios fechados (count)
- Valor total (sum de `deal_value`)
- Ticket medio

**3. Interface do relatorio**

- **Cards de resumo no topo**: Total de negocios no periodo, Valor total movimentado, Ticket medio
- **Filtros de periodo**: Botoes rapidos (Este mes, Mes passado, Ultimos 90 dias) + seletor de datas customizado
- **Tabela-ranking** ordenada por valor total decrescente:

| # | Fornecedor | Negocios | Valor Total | Ticket Medio | Acoes |
|---|---|---|---|---|---|
| 1 | Maria Festere | 5 | R$ 2.400,00 | R$ 480,00 | [Dar Bonus] |
| 2 | Joao Buffet | 3 | R$ 1.800,00 | R$ 600,00 | [Dar Bonus] |

- **Botao "Dar Bonus"**: Abre o modal `AddBonusCreditsModal` ja existente, pre-selecionando o fornecedor

**4. Componente separado `src/components/admin/DealsReportSection.tsx`**

Para manter o `Admin.tsx` organizado, o conteudo da aba sera extraido para um componente proprio que recebe os dados e callbacks como props.

**5. Nenhuma alteracao no banco de dados**

Todos os dados necessarios ja existem na tabela `leads_access` com as colunas `deal_closed`, `deal_value` e `deal_closed_at`. A query utilizara joins com `profiles` para obter nomes dos fornecedores. O acesso e garantido pelas politicas RLS existentes (admin pode ver todos os dados).

### Arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/components/admin/DealsReportSection.tsx` | Criar (novo componente) |
| `src/pages/Admin.tsx` | Editar (adicionar aba + fetch de dados) |

