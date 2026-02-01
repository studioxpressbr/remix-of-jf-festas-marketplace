

# Plano: Permitir Admin Visualizar Fornecedores Pendentes

## Problema Identificado

Quando o administrador clica no botão **"Ver"** na linha 463 do `Admin.tsx`:
```typescript
onClick={() => navigate(`/vendor/${vendor.profile_id}`)}
```

A página `VendorProfile.tsx` executa a seguinte consulta (linhas 49-53):
```typescript
const { data, error } = await supabase
  .from('vendors_public' as any)
  .select('*, profiles(full_name)')
  .eq('profile_id', id)
  .maybeSingle();
```

A view `vendors_public` só retorna fornecedores com `is_approved = true` e `subscription_status = 'active'`. Fornecedores pendentes não aparecem, resultando em redirecionamento para a home.

---

## Solução

Modificar `VendorProfile.tsx` para detectar se o usuário é admin e, se for, buscar diretamente da tabela `vendors` (que permite acesso total via RLS policy existente).

### Mudanças no Arquivo

**Arquivo:** `src/pages/VendorProfile.tsx`

1. Adicionar import do hook `useAdminRole`
2. Verificar se é admin antes de fazer a query
3. Se admin: buscar da tabela `vendors`
4. Se não admin: manter comportamento atual com `vendors_public`
5. Mostrar badge visual quando o fornecedor estiver pendente

### Código Atualizado

```typescript
import { useAdminRole } from '@/hooks/useAdminRole';

function VendorProfileContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  // ... outros estados

  useEffect(() => {
    async function fetchVendor() {
      if (!id || adminLoading) return;

      let data, error;

      if (isAdmin) {
        // Admin pode ver qualquer vendor (RLS permite)
        const result = await supabase
          .from('vendors')
          .select('*, profiles(full_name)')
          .eq('profile_id', id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        // Usuários normais só veem vendors aprovados
        const result = await supabase
          .from('vendors_public')
          .select('*, profiles(full_name)')
          .eq('profile_id', id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        navigate('/');
        return;
      }

      setVendor(data);
      setLoading(false);
    }

    fetchVendor();
  }, [id, navigate, isAdmin, adminLoading]);
  
  // ...
}
```

### Interface Atualizada

Adicionar campo `is_approved` à interface para permitir exibição condicional:

```typescript
interface VendorData {
  id: string;
  profile_id: string;
  business_name: string;
  category: string;
  description: string | null;
  neighborhood: string | null;
  images: string[];
  is_approved?: boolean; // Novo campo
  profiles: {
    full_name: string;
  } | null;
}
```

### Badge Visual para Admin

Quando o admin visualiza um perfil pendente, mostrar indicador:

```tsx
{isAdmin && vendor.is_approved === false && (
  <Badge variant="outline" className="border-coral text-coral">
    ⏳ Pendente de Aprovação
  </Badge>
)}
```

---

## Por que funciona?

A tabela `vendors` tem a política RLS:
```sql
Policy: "Admins can view all vendors"
Command: SELECT
Using: has_admin_role(auth.uid(), 'admin')
```

Isso garante que admins podem ver todos os fornecedores, incluindo pendentes.

---

## Resultado Esperado

1. Admin clica em "Ver" no painel → vê o perfil completo do fornecedor pendente
2. Badge "Pendente de Aprovação" aparece para indicar o status
3. Usuários normais continuam vendo apenas fornecedores aprovados
4. Segurança mantida via RLS existente

