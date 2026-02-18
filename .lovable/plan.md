

## Correção: Link "Seja Fornecedor" sempre marcado

**Custo: 0 creditos** (correção de bug)

### Problema

O link "Seja Fornecedor" usa a classe `text-primary` (cor de destaque), enquanto todos os outros links usam `text-muted-foreground`. Isso faz parecer que o item está sempre ativo/selecionado.

### Correção

**Arquivo: `src/components/layout/Header.tsx`**

- **Linha 85 (desktop):** Trocar `text-primary transition-colors hover:text-primary/80` por `text-muted-foreground transition-colors hover:text-foreground` (mesmo padrão dos outros links)
- **Linha 200 (mobile):** Trocar `text-primary` por nenhuma classe de cor extra (mesmo padrão dos outros links mobile)

