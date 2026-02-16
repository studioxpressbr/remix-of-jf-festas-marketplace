

## Restringir Link do Site ao Plano Empresarial

**Custo: 0 creditos** — correcao de regra de negocio ja definida, puramente frontend.

---

### Problema

O campo "Site" aparece para todos os fornecedores, independente do plano. Pela regra de negocio, apenas fornecedores do plano Empresarial podem incluir link para o site.

### Locais afetados

1. **VendorOnboarding.tsx** — O campo website_url aparece no Step 1 para todos. Como o onboarding nao define vendor_type (fica como `mei` por padrao no banco), o campo deve ser **removido do onboarding** ou exibido apenas se houver selecao de plano Empresarial. Como nao ha selecao de plano no onboarding, o campo sera removido.

2. **VendorEditProfileModal.tsx** — O campo website_url aparece sempre. Precisa receber `vendorType` como prop e exibir o campo apenas quando `vendorType === 'empresarial'`.

### Alteracoes

**Arquivo: `src/pages/VendorOnboarding.tsx`**
- Remover o campo `website_url` do formulario (Step 1)
- Manter `website_url` no schema Zod como opcional (nao quebra nada), mas o campo nao sera renderizado

**Arquivo: `src/components/vendor/VendorEditProfileModal.tsx`**
- Adicionar prop `vendorType: 'mei' | 'empresarial'` na interface
- Renderizar o campo "Site" condicionalmente: apenas quando `vendorType === 'empresarial'`
- Quando `vendorType === 'mei'`, garantir que `website_url` seja enviado como `null` no submit

**Arquivo: `src/pages/VendorDashboard.tsx`**
- Passar `vendorType={vendorInfo.vendor_type}` para o `VendorEditProfileModal`

### Detalhes Tecnicos

```text
VendorEditProfileModal:
  interface props: + vendorType: 'mei' | 'empresarial'

  No render:
    {vendorType === 'empresarial' && (
      <FormField name="website_url" ... />
    )}

  No submit:
    website_url: vendorType === 'empresarial' ? (data.website_url || null) : null

VendorOnboarding:
  Remover o bloco <FormField name="website_url"> (linhas ~458-474)
  No submit, enviar website_url: null

VendorDashboard:
  <VendorEditProfileModal vendorType={vendorInfo.vendor_type} ... />
```

Nenhuma alteracao de banco de dados necessaria.
