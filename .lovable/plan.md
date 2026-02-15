

## Revisao e Atualizacao do Dashboard do Fornecedor

### Problemas Identificados

1. **Tipagem incompleta**: A interface `Quote` (linha 55-69) nao inclui os campos de proposta (`proposed_value`, `proposed_at`, `proposal_message`, `contract_url`, `client_response`, `client_responded_at`). O codigo usa `(quote as any)` em 6 lugares (linhas 624, 637, 639, 644, 655), o que e fragil e impede verificacao de tipos.

2. **Fluxo visual incompleto**: Quando uma proposta e aceita pelo cliente, o `ClientProposalCard` marca o deal como fechado automaticamente, mas o dashboard nao distingue visualmente entre fechamento manual e fechamento via proposta aceita.

3. **Informacoes da proposta ocultas**: Apos enviar uma proposta, o fornecedor ve apenas um badge de status e o valor, mas nao ve a mensagem que enviou nem se anexou contrato.

4. **Botao "Fechei negocio" visivel apos proposta aceita**: Quando o cliente aceita a proposta, o deal e fechado automaticamente, mas pode haver um estado transitorio onde o botao ainda aparece.

---

### Alteracoes Planejadas

**Arquivo: `src/pages/VendorDashboard.tsx`**

1. **Atualizar interface `Quote`** (linhas 55-69) — adicionar campos de proposta:
   - `proposed_value: number | null`
   - `proposed_at: string | null`
   - `proposal_message: string | null`
   - `contract_url: string | null`
   - `client_response: string | null`
   - `client_responded_at: string | null`

2. **Remover todos os casts `(quote as any)`** (linhas 624, 637, 639, 644, 655) — substituir por acesso tipado direto.

3. **Melhorar secao de proposta enviada** (linhas 637-661) — exibir um bloco mais informativo quando a proposta ja foi enviada:
   - Mostrar valor proposto de forma destacada
   - Mostrar mensagem da proposta (se houver)
   - Indicar se contrato foi anexado
   - Badge de status (Aceita / Recusada / Aguardando) com data de resposta

4. **Ocultar botao "Fechei negocio" quando proposta foi aceita** — se `client_response === 'accepted'`, o deal ja foi fechado automaticamente, entao o botao manual nao deve aparecer.

---

### Detalhes Tecnicos

```text
Interface Quote (antes):
  id, client_id, event_date, pax_count, description, status,
  created_at, profiles, leads_access

Interface Quote (depois):
  + proposed_value, proposed_at, proposal_message,
  + contract_url, client_response, client_responded_at
```

Logica de exibicao de botoes (atualizada):
```text
Lead desbloqueado E sem proposta    -> [Enviar Proposta] [Fechei negocio]
Proposta enviada, aguardando        -> Badge "Aguardando" + valor + [Fechei negocio]
Proposta aceita                     -> Badge "Aceita" + valor (sem botao manual)
Proposta recusada                   -> Badge "Recusada" + [Enviar Proposta] + [Fechei negocio]
Deal fechado                        -> Badge com valor + [Avaliar cliente]
```

Nenhuma alteracao de banco de dados e necessaria — os campos ja existem na tabela `quotes`.
