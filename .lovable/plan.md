
# Plano: Melhorias de Edição para Admin

## Resumo das Melhorias

1. **Admin pode editar descrição e imagens** do fornecedor diretamente na página de perfil
2. **Nome clicável na lista de usuários** que navega para o perfil do fornecedor

---

## Mudança 1: Botão "Editar Perfil" para Admin na VendorProfile

### O que será feito

Adicionar um botão "Editar Perfil" visível apenas para administradores na página do fornecedor (`/vendor/:id`), que abre um modal para editar descrição e imagens.

### Arquivos a criar

**Novo componente: `src/components/admin/AdminVendorEditModal.tsx`**

Modal simplificado para o admin editar apenas:
- Descrição
- Imagens

Diferenças do modal do fornecedor:
- **NÃO** reseta o status de aprovação (admin já está revisando)
- **NÃO** mostra alerta de "pendente de aprovação"
- Título indica que é edição administrativa

### Arquivos a modificar

**`src/pages/VendorProfile.tsx`**

1. Adicionar import do novo modal
2. Adicionar estado `editModalOpen` para controlar o modal
3. Adicionar botão "Editar Perfil" ao lado do "Aprovar Fornecedor" (visível apenas para admin)
4. Atualizar a interface `VendorData` para incluir `custom_category`
5. Passar dados do fornecedor para o modal
6. Recarregar dados após salvar

---

## Mudança 2: Nome Clicável na Lista de Usuários do Admin

### O que será feito

Na tabela de usuários do painel admin, tornar o nome do usuário clicável. Se for fornecedor, navega para `/vendor/:profile_id`.

### Arquivo a modificar

**`src/pages/Admin.tsx`**

Na linha 622-624, modificar a célula do nome:

**Antes:**
```tsx
<TableCell className="font-medium">
  {profile.full_name}
</TableCell>
```

**Depois:**
```tsx
<TableCell className="font-medium">
  {profile.role === 'vendor' ? (
    <Button
      variant="link"
      className="h-auto p-0 text-primary"
      onClick={() => navigate(`/vendor/${profile.id}`)}
    >
      {profile.full_name}
    </Button>
  ) : (
    profile.full_name
  )}
</TableCell>
```

---

## Detalhes Técnicos

### Estrutura do AdminVendorEditModal

```typescript
interface AdminVendorEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorData: {
    id: string;
    description: string | null;
    images: string[] | null;
  };
  onSave: () => void;
}
```

### Schema de validação (admin simplificado)

```typescript
const adminEditSchema = z.object({
  description: z
    .string()
    .trim()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  images: z.array(z.string()).min(1, 'Adicione pelo menos 1 imagem'),
});
```

### Lógica de salvamento (admin)

O admin **NÃO** reseta o status de aprovação:

```typescript
await supabase
  .from('vendors')
  .update({
    description: data.description,
    images: data.images,
    // NÃO altera approval_status, is_approved, submitted_at
  })
  .eq('id', vendorData.id);
```

### RLS já permite

A política existente permite que admins atualizem vendors:

```sql
Policy: "Admins can update all vendors"
Command: UPDATE
Using: has_admin_role(auth.uid(), 'admin')
```

---

## Fluxo do Admin

```
1. Admin acessa /admin
2. Vê lista de fornecedores pendentes
3. Clica em "Ver" → abre /vendor/:id
4. Vê perfil com badge "Pendente de Aprovação"
5. Pode clicar em "Editar Perfil" para ajustar descrição/imagens
6. Após editar, clica em "Aprovar Fornecedor"
```

**Alternativo (via lista de usuários):**
```
1. Admin acessa /admin → aba "Usuários"
2. Clica no nome de um fornecedor
3. Navega para /vendor/:id
4. Pode editar e aprovar
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/admin/AdminVendorEditModal.tsx` | **Criar** - Modal de edição para admin |
| `src/pages/VendorProfile.tsx` | **Modificar** - Adicionar botão de edição e integrar modal |
| `src/pages/Admin.tsx` | **Modificar** - Tornar nome do fornecedor clicável |
