

## Relatórios Avançados Exclusivos para o Plano Empresarial

**Custo estimado: 1-2 créditos**

Os dados necessários já existem no banco (quotes, leads_access, vendor_credits). A implementação é puramente frontend com lógica de gating por `vendor_type`.

---

### O que será implementado

Uma nova seção "Relatórios Avançados" visível **apenas para fornecedores do plano Empresarial** (`vendor_type === 'empresarial'`), exibida abaixo do resumo básico atual. Fornecedores MEI verão um card de upsell convidando-os a fazer upgrade.

**Métricas exclusivas:**

1. **Taxa de conversão** — Percentual de leads desbloqueados que resultaram em negócio fechado (total e por período).
2. **ROI de créditos** — Valor total faturado dividido pelo custo dos créditos utilizados (quantidade de leads x R$2).
3. **Tempo médio de fechamento** — Dias entre o desbloqueio do lead e o fechamento do negócio.
4. **Desempenho de propostas** — Taxa de aceitação das propostas enviadas (aceitas vs. total).
5. **Gráfico de evolução** — Gráfico de barras (usando Recharts, já instalado) mostrando o volume de negócios fechados mês a mês nos últimos 6 meses.

---

### Gating (Controle de Acesso)

```text
Se vendor_type === 'empresarial':
  -> Exibe seção completa de relatórios avançados

Se vendor_type === 'mei':
  -> Exibe card com preview borrado + botão "Fazer upgrade"
     que redireciona para /precos
```

---

### Alterações Planejadas

**Arquivo: `src/pages/VendorDashboard.tsx`**

1. Adicionar cálculos `useMemo` para as 5 métricas acima, usando os dados já presentes no state (`quotes`, `creditHistory`).
2. Adicionar seção condicional com cards de métricas e gráfico de barras.
3. Adicionar card de upsell para fornecedores MEI.

**Arquivo novo: `src/components/vendor/AdvancedReportsSection.tsx`**

Componente extraído para manter o dashboard organizado, recebendo `quotes`, `creditHistory` e `vendorType` como props.

---

### Layout dos Cards

```text
+---------------------+---------------------+
|  Taxa de Conversão  |   ROI de Créditos   |
|       45%           |      3.2x           |
+---------------------+---------------------+
|  Tempo Médio        | Propostas Aceitas   |
|     5.3 dias        |      62%            |
+---------------------+---------------------+

[Gráfico de barras - Negócios por mês (últimos 6 meses)]
```

---

### Detalhes Técnicos

```text
Taxa de conversão:
  (leads com deal_closed) / (total de leads desbloqueados) * 100

ROI de créditos:
  valor total faturado / (quantidade de leads desbloqueados * 2)

Tempo médio de fechamento:
  média de (deal_closed_at - leads_access.created_at) em dias

Taxa de aceitação de propostas:
  (quotes com client_response === 'accepted') /
  (quotes com proposed_at !== null) * 100

Gráfico mensal:
  Agrupa deals por mês usando deal_closed_at,
  renderiza com Recharts BarChart (já instalado)
```

Nenhuma alteração de banco de dados ou edge functions necessária.
