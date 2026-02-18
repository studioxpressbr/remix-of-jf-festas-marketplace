## Pagina "Para Clientes" — Vantagens da Plataforma

**Custo estimado: 1 credito**

Pagina estatica simples seguindo o mesmo padrao de layout das paginas existentes (Precos, Termos).

---

### O que sera criado

Uma pagina `/para-clientes` com as seguintes secoes:

1. **Hero** — Titulo "Por que usar o JF Festas?" com subtitulo reforçando a gratuidade
2. **Cards de vantagens** (grid 2x3 em desktop, 1 coluna em mobile):
  - Cadastro 100% gratuito
  - Sem obrigacao de aceitar cotacoes
  - Acesso a promocoes e ofertas exclusivas para cadastrados
  - Fornecedores verificados pela plataforma
  - Avalie fornecedores após evento
  - Contato direto com profissionais
  - Avaliacoes reais de outros clientes
3. **Secao "Como funciona"** — 3 passos simples (Cadastre-se, Solicite cotacoes, Escolha o melhor)
4. **CTA final** — Botao "Cadastre-se Gratuitamente" que abre o AuthModal no modo `client`
5. **Footer** — Mesmo footer usado na Index

### Alteracoes

**Arquivo novo: `src/pages/ParaClientes.tsx**`

- Segue o padrao das outras paginas: wrapper AuthProvider, Header, conteudo, footer
- Usa componentes existentes: Card, Badge, Button, AuthModal
- Icones do Lucide para cada vantagem
- CTA abre AuthModal com `mode="client"`

**Arquivo: `src/App.tsx**`

- Adicionar rota `/para-clientes` apontando para o novo componente

**Arquivo: `src/components/layout/Header.tsx**`

- Adicionar link "Para Clientes" no menu desktop e mobile (visivel apenas para usuarios nao logados ou clientes), posicionado antes de "Blog"

---

### Detalhes Tecnicos

```text
App.tsx:
  import ParaClientes from "./pages/ParaClientes";
  <Route path="/para-clientes" element={<ParaClientes />} />

Header.tsx (nav desktop + mobile):
  Adicionar link para /para-clientes
  Visivel quando: !user || profile?.role === 'client'
  Posicao: antes do link "Blog"

ParaClientes.tsx:
  - AuthProvider wrapper
  - Header
  - Hero com Badge + h1 + subtitulo
  - Grid de 6 cards com icone + titulo + descricao
  - Secao "Como funciona" com 3 passos numerados
  - CTA com useState para AuthModal mode="client"
  - Footer igual ao da Index
```