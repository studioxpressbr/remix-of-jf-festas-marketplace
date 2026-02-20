
## Corrigir Sobreposição Visual nos Cards da Busca

### Diagnóstico do Problema

O `VendorCard` tem uma falha estrutural no posicionamento:

```text
<Link>
  <Card>                          ← sem "relative", tem overflow-hidden
    <div class="relative h-64">  ← imagem + overlay ficam aqui
    </div>
    <CardContent class="absolute bottom-0"> ← PROBLEMA: ancora no Card,
                                              que não é "relative"
    </CardContent>
  </Card>
</Link>
```

O `CardContent` com `absolute bottom-0 left-0 right-0` deveria estar dentro do `div` da imagem (que tem `relative`), mas está **fora** dele. Como o `Card` não tem `position: relative`, o elemento se ancora incorretamente — causando sobreposição visual sobre o cupom, avaliações e conteúdo de cards vizinhos.

---

### Solução

Mover o `CardContent` para **dentro** do `div` que contém a imagem (que já tem `relative`), e adicionar `relative` ao `Card` como salvaguarda. Também adicionar `overflow-hidden` ao `Link` raiz para garantir que nada vaze além das bordas arredondadas.

**Estrutura corrigida:**

```text
<Link>
  <Card class="relative overflow-hidden">
    <div class="relative h-64">       ← imagem + gradient
      <img />
      <div gradient />
      <div badges (top) />
      <CardContent absolute bottom-0> ← CORRETO: dentro do div relative
        Nome, bairro, avaliação
      </CardContent>
    </div>
  </Card>
</Link>
```

---

### Arquivo a editar

**`src/components/home/VendorCard.tsx`** — 1 arquivo, ~10 linhas alteradas:

1. Adicionar `relative` ao `Card` (linha 43)
2. Mover o `<CardContent>` de fora do `div` da imagem para **dentro** dele, antes do fechamento `</div>` (linha 80)
3. Garantir que os badges de topo (categoria + cupom) continuam visíveis com `z-10`
4. Adicionar `z-10` ao `CardContent` para garantir que ele fica acima do overlay de gradiente

---

### Impacto

- Resolve a sobreposição do badge de cupom sobre elementos de outros cards
- Resolve a sobreposição da avaliação (estrelas + contagem) sobre outros elementos
- Nenhuma mudança visual intencional — apenas o posicionamento é corrigido
- Nenhuma alteração em outros arquivos
