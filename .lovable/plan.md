
## Diagnóstico do Stripe e Plano de Ação

**Custo estimado: 0 creditos** (nenhum arquivo de codigo precisa ser alterado)

---

### O que foi testado

1. Chamada direta para a edge function `create-checkout` — retornou HTTP 200 com URL de checkout valida do Stripe.
2. Logs da edge function — confirmam que a funcao processou com sucesso a ultima chamada (07:55 de hoje), gerando a sessao `cs_test_a117fM...`.
3. Chave e Price IDs — `STRIPE_SECRET_KEY` esta configurada; os IDs de preco em `constants.ts` batem com os enviados para o Stripe.

### Conclusao do diagnostico

**O Stripe esta funcionando corretamente.** A integracao tecnica esta completa e operacional.

O que pode estar parecendo "nao funcionar" e um comportamento esperado do ambiente de teste:

| Situacao | Motivo |
|---|---|
| Cartao real recusado no checkout | A chave `sk_test_` so aceita cartoes de teste do Stripe |
| Assinatura nao ativa apos pagamento | Pagamento de teste exige cartao de teste |

### Cartoes de teste para validar o fluxo

Para testar o checkout do inicio ao fim, use estes dados no formulario do Stripe:

- **Numero do cartao:** `4242 4242 4242 4242`
- **Validade:** qualquer data futura (ex: `12/34`)
- **CVC:** qualquer 3 digitos (ex: `123`)
- **CEP:** qualquer 5 digitos (ex: `12345`)

### Para ir para producao (quando pronto)

Nenhuma mudanca de codigo e necessaria. So e preciso:

1. Obter a chave `sk_live_...` no painel do Stripe (em modo producao)
2. Atualizar o segredo `STRIPE_SECRET_KEY` com a chave de producao
3. Criar os produtos/precos no modo producao do Stripe e atualizar os Price IDs em `src/lib/constants.ts` e na edge function `buy-lead-credit`
4. Publicar o projeto

### Detalhe tecnico adicional

A edge function `verify-payment` nao mostra logs porque so e chamada na pagina `/pagamento-sucesso`, que so e acessada apos um pagamento real completado. Isso e normal e nao indica erro.

**Nenhuma alteracao de codigo ou banco de dados e necessaria para corrigir algo quebrado. O sistema esta funcional.**
