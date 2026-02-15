
## Atualizar o Price ID do Plano Empresarial

O produto foi recriado no Stripe com um novo Price ID. A correcao consiste em atualizar uma unica linha no arquivo de constantes.

### Alteracao

**Arquivo:** `src/lib/constants.ts` (linha 51)

- **De:** `priceId: 'price_1T0O3kPBxEvxO8pMReV3b3Qd'`
- **Para:** `priceId: 'price_1T1Dy9RDc1lDOFiCBOwBhCrW'`

Tambem sera atualizado o `productId` para o correto: `prod_TyKj9SRXANiUjY`.

### Validacao

Apos a alteracao, sera feito um teste chamando a funcao de checkout para confirmar que o Stripe aceita o novo price ID.

### Custo estimado

0 creditos — correcao de configuracao ja solicitada anteriormente.
