
## Landing Page "Seja Fornecedor" - Para campanhas Google Ads

### Estimativa de creditos
**1 credito** - e uma unica pagina nova substituindo o conteudo atual de `/cadastro-fornecedor`.

---

### Conceito da pagina

Uma landing page de alta conversao, otimizada para campanhas pagas (Google Ads), com foco em convencer fornecedores de festas a se cadastrarem na JF Festas. A pagina sera construida no mesmo arquivo `src/pages/VendorOnboarding.tsx`, substituindo o conteudo exibido para usuarios **nao logados** (a logica de onboarding para usuarios logados permanece intacta).

---

### Estrutura das secoes

**1. Hero com gradiente e CTA duplo**
- Titulo impactante: "Aumente suas vendas com a JF Festas"
- Subtitulo curto explicando o valor
- Dois botoes lado a lado:
  - **"Comece Agora"** (botao primario, laranja) - abre o AuthModal no modo vendor
  - **"Agende uma Demonstracao"** (botao outline) - abre link do WhatsApp ou formulario simples
- Badge "Para Fornecedores" no topo

**2. Numeros / Prova social**
- 3-4 metricas em destaque (ex: "500+ clientes buscando", "16 categorias", "Juiz de Fora e regiao")
- Exibidas em cards horizontais com icones

**3. Vantagens para o fornecedor (6 cards)**
- Perfil profissional com fotos e avaliacoes
- Receba cotacoes de clientes reais
- Sem taxa de agenciamento
- Cupons e promocoes para seus clientes
- Dashboard com relatorios
- Divulgacao no Instagram @festasemjf

**4. Como funciona (3 passos)**
- 1. Cadastre-se gratuitamente
- 2. Monte seu perfil e aguarde aprovacao
- 3. Comece a receber cotacoes e fechar negocios

**5. Planos e precos (resumo)**
- Cards do Plano MEI (R$ 99/ano) e Empresarial (R$ 499/ano) com as principais features
- Botoes com links diretos para o Stripe (reutilizando os links ja configurados)

**6. Depoimentos / Prova social**
- 2-3 depoimentos ficticios de fornecedores satisfeitos (dados demo)

**7. FAQ compacto**
- 4 perguntas frequentes sobre o cadastro

**8. CTA final**
- Repetindo os dois botoes: "Comece Agora" e "Agende uma Demonstracao"

**9. Footer**
- Links para Termos, Instagram e copyright

---

### Detalhes tecnicos

**Arquivo editado:** `src/pages/VendorOnboarding.tsx`

- A logica sera: se o usuario **nao esta logado**, exibe a landing page de vendas
- Se o usuario **esta logado**, exibe o formulario de onboarding existente (comportamento atual mantido)
- O botao "Comece Agora" abre o `AuthModal` no modo `vendor`
- O botao "Agende uma Demonstracao" abre o WhatsApp (preciso do numero) ou abre o Instagram da JF Festas
- Reutiliza componentes existentes: `Header`, `Button`, `Card`, `Badge`, `AuthModal`
- Segue a identidade visual existente: gradientes laranja/coral, tipografia Playfair Display + DM Sans
- Responsivo mobile-first

**Rota:** Permanece em `/cadastro-fornecedor` (o link "Seja Fornecedor" no menu ja aponta para la)

---

### Duvida antes de implementar

Para o botao **"Agende uma Demonstracao"**, qual destino voce prefere?
- Link para WhatsApp (me passe o numero)
- Link para o Instagram @festasemjf
- Ou outro destino?
