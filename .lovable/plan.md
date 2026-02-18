
## Correções: Menu com hover/active laranja + Imagens no Hero

**Custo: 0 creditos** (correções de implementacao anterior)

---

### 1. Menu com hover laranja e indicacao de pagina ativa

Substituir os `<Link>` do react-router por `<NavLink>` (componente que ja existe em `src/components/NavLink.tsx`) em todos os itens de navegacao do Header. Isso permite aplicar uma classe diferente quando o usuario esta na pagina correspondente.

- **Hover**: classe `hover:text-primary` (laranja)
- **Pagina ativa**: classe `text-primary font-semibold` (laranja + negrito)
- **Estado normal**: `text-muted-foreground` (cinza, como esta hoje)

Aplica-se tanto ao menu desktop quanto ao mobile.

**Arquivo:** `src/components/layout/Header.tsx`

---

### 2. Imagens de fundo no Hero (1.png, 2.png, 3.png)

Substituir os gradientes CSS por imagens de fundo reais. Voce devera fazer upload de 3 imagens chamadas `1.png`, `2.png` e `3.png` na pasta `public/` do projeto (pode enviar pelo chat).

O carousel passara a usar essas imagens como background via CSS (`background-image`), com o texto sobreposto em HTML com uma camada semi-transparente para garantir legibilidade.

Estrutura de cada slide:
```text
<div style="background-image: url('/1.png')" class="bg-cover bg-center">
  <div class="bg-black/40">  <!-- overlay para legibilidade -->
    <h1 class="text-white">Titulo</h1>
    <p class="text-white/90">Subtitulo</p>
  </div>
</div>
```

Para trocar as imagens futuramente, basta substituir os arquivos `public/1.png`, `public/2.png` e `public/3.png`.

**Arquivo:** `src/pages/ParaClientes.tsx`

---

### Detalhes Tecnicos

```text
Header.tsx:
  - import { NavLink } from '@/components/NavLink'
  - Trocar todos os <Link to="/rota"> por:
    <NavLink
      to="/rota"
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      activeClassName="text-primary font-semibold"
    >
  - Aplicar no desktop e mobile
  - Links externos (Blog, Instagram) continuam como <a> com hover:text-primary

ParaClientes.tsx:
  - heroSlides passa a ter campo `image` em vez de `gradient`:
    { image: "/1.png", title: "...", subtitle: "..." }
  - Cada slide renderiza:
    <div
      className="bg-cover bg-center bg-no-repeat py-16 md:py-24"
      style={{ backgroundImage: `url(${slide.image})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="container relative text-center">
        <h1 className="text-white ...">...</h1>
        <p className="text-white/90 ...">...</p>
      </div>
    </div>
  - Imagens esperadas: public/1.png, public/2.png, public/3.png
```
