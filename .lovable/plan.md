

## Unificar Login em um Botao Unico

### Problema Atual
- Header tem dois botoes: "Sou Cliente" e "Sou Fornecedor"
- Ambos abrem o mesmo AuthModal, so muda o `mode`
- Para LOGIN, o mode e irrelevante — o email ja determina o role
- O mode so importa no CADASTRO (signup), para definir o role no perfil

### Solucao

#### 1. Header: Botao unico "Entrar" (~1 credito)
**Arquivo:** `src/components/layout/Header.tsx`
- Remover os dois botoes "Sou Cliente" e "Sou Fornecedor"
- Substituir por um unico botao "Entrar"
- Abrir o AuthModal em modo login por padrao
- No mobile menu, mesma mudanca: um botao "Entrar" ao inves de dois

#### 2. AuthModal: Escolha de role apenas no cadastro (~1 credito)
**Arquivo:** `src/components/auth/AuthModal.tsx`
- Remover a prop `mode` obrigatoria — o modal gerencia internamente
- Quando o usuario clica "Nao tem conta? Cadastre-se", mostrar opcao para escolher: "Sou Cliente" ou "Sou Fornecedor"
- O login permanece identico (email + senha), sem mencao a role
- O titulo do modal muda: login = "Entrar", cadastro = mostra escolha de role
- Manter a prop `mode` como opcional para os CTAs do HeroSection que ja direcionam para cadastro especifico

#### 3. HeroSection: Manter CTAs de cadastro (~0 creditos)
**Arquivo:** `src/components/home/HeroSection.tsx`
- Manter "Cadastrar Fornecedor" e "Sou Cliente" como estao — sao CTAs de marketing que direcionam para cadastro especifico
- Esses botoes continuam passando o `mode` para o AuthModal, abrindo direto no cadastro com role pre-selecionado

### Detalhes Tecnicos

#### AuthModal: Nova interface da prop
```text
interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'client' | 'vendor';        // opcional agora
  defaultToLogin?: boolean;           // novo: abrir em login por padrao
}
```

#### Fluxo do Login (via Header)
1. Clica "Entrar" -> abre modal em modo login
2. Preenche email + senha -> loga
3. Se nao tem conta, clica "Cadastre-se" -> aparece escolha de role (cliente/fornecedor)
4. Escolhe role -> preenche dados -> cadastra

#### Fluxo do Cadastro (via HeroSection)
1. Clica "Cadastrar Fornecedor" -> abre modal ja em modo cadastro com role = vendor
2. Clica "Sou Cliente" -> abre modal ja em modo cadastro com role = client
3. Fluxo identico ao atual

### Estimativa: ~2 creditos
