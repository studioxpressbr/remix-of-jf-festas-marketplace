
## Trocar nomes dos depoimentos para fornecedores reais

### O que muda

No arquivo `src/components/vendor/VendorLandingPage.tsx`, os 3 depoimentos da seção de prova social terão os nomes fictícios substituídos pelos nomes de fornecedores já cadastrados na plataforma:

| Atual | Novo |
|---|---|
| Ana Paula S. / Confeitaria Doce Encanto | FunFesta |
| Rafael M. / RF Decorações | Salgakits |
| Camila T. / Buffet Sabor da Festa | Maria Festerê |

Os comentários e ratings permanecem os mesmos. O campo `name` será removido ou simplificado, e o campo `role` receberá o nome real do fornecedor.

### Estimativa
Menos de **1 crédito** -- é uma edição de 6 linhas em um único arquivo.
