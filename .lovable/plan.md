
# Plano: Exibir Cupons Ativos no Perfil do Fornecedor

## Resumo
Adicionar uma seção de cupons ativos na página de perfil do fornecedor (`VendorProfile.tsx`), visível para clientes e usuários não cadastrados. O cupom exibirá:
- Código do cupom
- Valor do desconto (percentual ou fixo)
- Data de validade
- Pedido mínimo (novo campo a ser adicionado)

---

## O que será feito

### 1. Adicionar campo "Pedido Mínimo" na tabela de cupons
- Criar nova coluna `min_order_value` (numeric, nullable) na tabela `coupons`
- Valor padrão: null (sem valor mínimo)

### 2. Atualizar o formulário de criação de cupons
- Adicionar campo "Pedido Mínimo (R$)" no `VendorCouponModal.tsx`
- Campo opcional - deixar em branco significa que não há valor mínimo

### 3. Criar componente para exibir cupons no perfil público
- Novo componente: `VendorProfileCoupons.tsx`
- Exibe cupons ativos e não expirados do fornecedor
- Layout visual atrativo tipo "cartão de cupom" com:
  - Código em destaque
  - Valor do desconto
  - Data de validade
  - Pedido mínimo (se houver)

### 4. Integrar na página VendorProfile
- Adicionar seção de cupons após a descrição do fornecedor
- Buscar cupons ativos via `vendors_public` ou query direta (RLS já permite visualização pública de cupons ativos)

---

## Detalhes Técnicos

### Alteração no Banco de Dados

```sql
ALTER TABLE coupons
ADD COLUMN min_order_value numeric DEFAULT NULL;
```

### Arquivos a serem modificados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Adicionar coluna `min_order_value` |
| `src/components/vendor/VendorCouponModal.tsx` | Adicionar campo de pedido mínimo |
| `src/components/vendor/VendorCouponsSection.tsx` | Exibir pedido mínimo nos cupons |
| `src/components/vendor/VendorProfileCoupons.tsx` | **Novo** - Componente de exibição pública |
| `src/pages/VendorProfile.tsx` | Integrar seção de cupons |

### Layout do Cupom Público

```text
+----------------------------------------+
|  🎟️  FEST10                            |
|  --------------------------------       |
|  📦 10% de desconto                     |
|  📅 Válido até 11/02                    |
|  💰 Pedido mínimo: R$ 150,00            |
+----------------------------------------+
```

### Query para buscar cupons públicos

```typescript
const { data: coupons } = await supabase
  .from('coupons')
  .select('code, discount_type, discount_value, expires_at, min_order_value')
  .eq('vendor_id', vendorId) // vendor.id da tabela vendors
  .eq('is_active', true)
  .gt('expires_at', new Date().toISOString())
  .order('created_at', { ascending: false });
```

A RLS já permite que qualquer usuário visualize cupons ativos:
```sql
Policy: "Anyone can view active coupons"
Using: ((is_active = true) AND (expires_at > now()))
```

---

## Considerações

- **Segurança**: A RLS já configurada permite visualização pública de cupons ativos
- **Performance**: Query leve, apenas campos necessários selecionados
- **UX**: Cupons exibidos apenas se existirem (seção oculta se não houver cupons)
- **Responsividade**: Layout adaptado para mobile e desktop

---

## Resultado Esperado
Clientes e visitantes verão os cupons ativos do fornecedor na página de perfil, com todas as informações necessárias para usar o desconto: código, valor, validade e pedido mínimo.
