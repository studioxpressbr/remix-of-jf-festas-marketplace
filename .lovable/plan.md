

## Alterar "Explorar" para "Blog" no Header

### Mudancas

**Arquivo:** `src/components/layout/Header.tsx`

1. **Desktop nav:** Mover o link "Explorar" para a ultima posicao (apos "Seja Fornecedor"), trocar o rotulo para "Blog" e o href para `https://jffestas.com.br/blog/`. Usar tag `<a>` em vez de `<Link>` pois e URL externa, sem `target="_blank"` para abrir na mesma pagina.

2. **Mobile menu:** Mesma mudanca — mover o item "Explorar" para o final, trocar rotulo para "Blog" e href para a URL externa, abrindo na mesma pagina.

### Estimativa: ~1 credito

