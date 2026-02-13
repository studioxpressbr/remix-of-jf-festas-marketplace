
## Máscara Monetária Brasileira no Campo de Proposta

### Objetivo
Adicionar uma máscara de entrada monetária brasileira (R$ 1.000,00) no campo de valor da proposta do fornecedor no componente `VendorProposalModal.tsx`.

### Análise Atual
- O campo atualmente aceita texto livre e processa valores na submissão com `parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'))`
- Não há utilitário centralizado de formatação monetária no projeto
- Existem funções `formatCurrency()` em componentes específicos que usam `Intl.NumberFormat('pt-BR')`

### Solução Proposta

#### Abordagem
Implementar uma função de máscara monetária customizada que:
1. Formata a entrada em tempo real conforme o usuário digita
2. Segue o padrão brasileiro: R$ 1.000,00 (separador de milhar com ponto, decimal com vírgula)
3. Permite apenas dígitos e vírgula como entrada
4. Limita a 2 casas decimais
5. Mostra o símbolo "R$" e formatação enquanto digita

#### Implementação
Adicionar ao `VendorProposalModal.tsx`:

1. **Função `formatMonetaryValue(value: string)`**:
   - Remove caracteres não numéricos (exceto vírgula)
   - Valida que só há um separador decimal
   - Limita a 2 casas decimais
   - Formata com separador de milhar (ponto) e decimal (vírgula)
   - Exemplo: "1000" → "1.000,00", "1234567" → "1.234.567,00"

2. **Handler `handleValueChange(e: React.ChangeEvent<HTMLInputElement>)`**:
   - Chama `formatMonetaryValue()` para formatar a entrada
   - Atualiza o estado `value` com o resultado formatado

3. **Atualizar o Input**:
   - Mudar placeholder de "0,00" para "0,00" (opcional, já correto)
   - Adicionar `maxLength="20"` para evitar entradas muito longas
   - Trocar `onChange` para usar o novo handler

#### Benefícios
- UX melhorada: usuário vê imediatamente a formatação correta
- Menos erros de entrada de valores
- Consistente com padrões brasileiros
- Sem dependência de bibliotecas externas

#### Impacto
- Mudanças localizadas apenas no `VendorProposalModal.tsx`
- A lógica de parsing já existente (`handleSubmit`) continuará funcionando normalmente
- Compatível com toda a stack atual do projeto

#### Exemplos de Entrada/Saída
- "1234567" → "1.234.567,00"
- "100" → "100,00"
- "1000,50" → "1.000,50"
- "999999999,99" → "999.999.999,99"

