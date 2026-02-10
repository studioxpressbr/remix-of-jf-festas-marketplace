

## Plano: Traducao de erros + Cor do alerta de vermelho para laranja

### Resumo de creditos

| Acao | Creditos estimados |
|---|---|
| 1. Criar mapeamento de erros de autenticacao (pt-BR) | 1 |
| 2. Mudar cor do alerta destrutivo de vermelho para laranja | 0 (incluso no mesmo credito) |
| **Total** | **~1 credito** |

---

### 1. Criar arquivo `src/lib/auth-errors.ts`

Funcao `translateAuthError(message)` com mapeamento das mensagens mais comuns:

- "Invalid login credentials" -> "Email ou senha incorretos."
- "Email not confirmed" -> "Seu email ainda nao foi confirmado. Verifique sua caixa de entrada."
- "User already registered" -> "Este email ja esta cadastrado."
- "Password should be at least 6 characters" -> "A senha deve ter pelo menos 6 caracteres."
- "Email rate limit exceeded" -> "Muitas tentativas. Aguarde alguns minutos."
- "For security purposes, you can only request this after" -> "Por seguranca, aguarde alguns segundos antes de tentar novamente."
- "New password should be different from the old password" -> "A nova senha deve ser diferente da senha atual."
- "Unable to validate email address: invalid format" -> "Formato de email invalido."

### 2. Aplicar traducao nos componentes

- `src/components/auth/AuthModal.tsx` - envolver `error.message` com `translateAuthError()` nos 3 blocos catch.
- `src/pages/ResetPassword.tsx` - aplicar no bloco catch do `handleSubmit`.

### 3. Mudar cor do alerta destrutivo de vermelho para laranja

Alterar as variaveis CSS `--destructive` em `src/index.css`:

- **Tema claro:** de `0 84% 60%` (vermelho) para `25 95% 53%` (laranja)
- **Tema escuro:** de `0 62% 50%` para `25 90% 48%`

Tambem atualizar as referencias a cores vermelhas no componente `ToastClose` em `src/components/ui/toast.tsx`, trocando `red-300`, `red-50`, `red-400`, `red-600` por equivalentes em laranja (`orange-300`, `orange-50`, `orange-400`, `orange-600`).

