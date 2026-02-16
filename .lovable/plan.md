

## Teste dos Relatórios Avançados

### Situação atual
Todos os 4 fornecedores estão no plano MEI. Nenhum deles vê os relatórios avançados — todos veem o card de upsell com preview borrado.

### Proposta para teste
Alterar temporariamente o `vendor_type` do fornecedor **"Delícias da Dê"** (perfil dlima 123) de `mei` para `empresarial` via migração no banco. Esse perfil é ideal porque:

- Você já está logado com ele
- Possui 7 cotações, 6 leads desbloqueados e 5 negócios fechados
- Permite validar todas as métricas com dados reais

### O que será feito
1. Executar uma migração SQL para alterar o `vendor_type` de "Delícias da Dê" para `empresarial`
2. Recarregar o dashboard para verificar a seção completa de relatórios

### Reversão
Após o teste, se desejar reverter para MEI, basta solicitar — será outra migração simples.

### Detalhes Técnicos

A migração será:
```text
UPDATE vendors
SET vendor_type = 'empresarial'
WHERE id = '32be5f92-0efd-4919-9a6b-e7934bf628d4';
```

Nenhuma outra alteração necessária.

