
# Plano: Implementar Login com Google

## Resumo
Adicionar a opção de login com Google ao modal de autenticação existente, mantendo também a opção de email/senha. O Lovable Cloud já oferece Google OAuth gerenciado, então não será necessário configurar credenciais no Google Cloud Console.

---

## O que será feito

### 1. Configurar o provedor Google OAuth
- Usar a ferramenta integrada do Lovable Cloud para ativar o Google como provedor de autenticação
- Isso gerará automaticamente o módulo necessário em `src/integrations/lovable`

### 2. Atualizar o Modal de Autenticação
- Adicionar botão "Continuar com Google" no `AuthModal.tsx`
- Posicionar o botão acima do formulário de email/senha
- Adicionar um separador visual "ou" entre as opções
- Manter toda a lógica existente de email/senha funcionando

### 3. Tratar o fluxo de novos usuários via Google
- Usuários que fizerem login com Google pela primeira vez terão um perfil criado automaticamente (já existe o trigger `handle_new_user`)
- O nome virá do perfil do Google
- Para fornecedores, será necessário completar o cadastro com WhatsApp posteriormente

---

## Detalhes Técnicos

### Arquivos a serem modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/auth/AuthModal.tsx` | Adicionar botão Google e função de login social |
| `src/integrations/lovable/` | Gerado automaticamente pela ferramenta |

### Fluxo de autenticação com Google

```text
Usuário clica "Continuar com Google"
         |
         v
Redirecionado para tela de login Google
         |
         v
Autoriza o acesso
         |
         v
Retorna ao app com sessão ativa
         |
         v
Trigger cria perfil automaticamente (se novo usuário)
         |
         v
Usuário logado e redirecionado
```

### Código do botão Google (exemplo)

```typescript
import { lovable } from "@/integrations/lovable/index";

const handleGoogleLogin = async () => {
  setLoading(true);
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (error) {
    toast({
      title: 'Erro',
      description: error.message,
      variant: 'destructive',
    });
  }
  setLoading(false);
};
```

---

## Considerações

- **Sem configuração manual**: O Google OAuth gerenciado do Lovable Cloud funciona automaticamente
- **WhatsApp obrigatório para fornecedores**: Usuários que fizerem login com Google e forem fornecedores precisarão completar o cadastro com WhatsApp na página de onboarding
- **Contas existentes**: Se um usuário já tiver conta com email/senha e tentar fazer login com Google usando o mesmo email, as contas serão vinculadas automaticamente

---

## Resultado Esperado
O modal de login terá um botão "Continuar com Google" que permite autenticação rápida com um clique, mantendo a opção tradicional de email/senha para quem preferir.
