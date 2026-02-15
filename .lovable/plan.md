

## Resumo de Contratos Fechados no Dashboard do Fornecedor

**Custo: 0 créditos** — os dados necessarios ja sao carregados no dashboard (via `leads_access` dentro de cada `quote`). A implementacao e puramente frontend.

---

### O que sera adicionado

Um card de resumo exibido logo abaixo dos cards de assinatura/creditos, mostrando:

- **Negocios fechados** nos ultimos 30, 60 e 90 dias (contagem)
- **Valor total** faturado em cada periodo
- **Ticket medio** (valor total / quantidade)

O layout sera em 3 colunas (ou empilhadas no mobile), cada uma representando um periodo.

---

### Origem dos dados

Os dados ja estao disponiveis no state `quotes`, que inclui `leads_access` com:
- `deal_closed: boolean`
- `deal_value: number | null`
- `deal_closed_at: string | null`

Tambem serao considerados deals fechados via proposta aceita (`client_response === 'accepted'`), usando `proposed_value` quando `deal_value` nao estiver preenchido.

Nenhuma query adicional ao banco e necessaria.

---

### Alteracoes

**Arquivo: `src/pages/VendorDashboard.tsx`**

1. **Adicionar calculo `useMemo`** que filtra os deals fechados por periodo (30, 60, 90 dias) e calcula contagem, valor total e ticket medio.

2. **Adicionar cards de resumo** no layout, posicionados entre os cards de assinatura/creditos e a lista de cotacoes. Cada card mostra:

```text
+------------------+------------------+------------------+
|   Ultimos 30d    |   Ultimos 60d    |   Ultimos 90d    |
|   3 negocios     |   7 negocios     |   12 negocios    |
|   R$ 4.500,00    |   R$ 10.200,00   |   R$ 18.600,00   |
|   TM: R$ 1.500   |   TM: R$ 1.457   |   TM: R$ 1.550   |
+------------------+------------------+------------------+
```

3. **Icones utilizados**: `Handshake` (negocios), `DollarSign` (valor), `TrendingUp` (ticket medio) — todos ja importados ou disponiveis no lucide-react.

---

### Detalhes Tecnicos

```text
Calculo (useMemo sobre quotes):
  Para cada periodo [30, 60, 90]:
    - Filtrar leads_access onde deal_closed === true
      E deal_closed_at >= (hoje - N dias)
    - Incluir tambem quotes com client_response === 'accepted'
      E client_responded_at >= (hoje - N dias)
    - Valor = deal_value ?? proposed_value ?? 0
    - Contagem = length
    - Ticket medio = total / contagem (ou 0)
```

Nenhuma alteracao de banco de dados, edge functions ou novas dependencias.

