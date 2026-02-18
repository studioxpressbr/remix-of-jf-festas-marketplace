

## Adicionar imagens do hero ao projeto

**Custo: 0 creditos** (complemento da implementacao anterior)

### Acao

Copiar as 3 imagens enviadas para a pasta `public/`:

- `user-uploads://1.png` -> `public/1.png` (bolo de aniversario)
- `user-uploads://2.png` -> `public/2.png` (mesa decorada ao ar livre)
- `user-uploads://3.png` -> `public/3.png` (buffet com chef)

Nenhuma alteracao de codigo e necessaria, pois o `src/pages/ParaClientes.tsx` ja referencia `/1.png`, `/2.png` e `/3.png` como imagens de fundo do carousel hero.

### Resultado esperado

O carousel da pagina "Para Clientes" passara a exibir as 3 imagens como fundo dos slides, com o texto sobreposto e overlay semi-transparente para legibilidade.

Para trocar as imagens futuramente, basta enviar novos arquivos com os mesmos nomes.
