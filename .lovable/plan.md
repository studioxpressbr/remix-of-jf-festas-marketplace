
# Plano: Correção do Erro "Failed to Fetch" no Sistema de Créditos Bônus

## Diagnóstico

A Edge Function `add-bonus-credits` está funcionando corretamente - testei diretamente e adicionei 15 créditos ao fornecedor com sucesso.

O erro "Failed to fetch" no navegador acontece porque:
1. A função tem "cold start" (demora ~30ms para iniciar quando está inativa)
2. O navegador pode ter timeout curto ou problemas de rede transitórios
3. Não há mecanismo de retry no código atual

## Correções Propostas

### 1. Adicionar retry automático no modal

Modificar `AddBonusCreditsModal.tsx` para tentar novamente em caso de erro de rede:

```text
+----------------------------------------+
| Tentativa 1 → Falhou                   |
| Tentativa 2 → Falhou                   |
| Tentativa 3 → Sucesso!                 |
+----------------------------------------+
```

### 2. Melhorar mensagens de erro

Diferenciar entre erros de rede e erros da API:
- Erro de rede: "Problema de conexão. Tentando novamente..."
- Erro da API: Mostrar mensagem específica do servidor

### 3. Adicionar timeout maior

Configurar timeout de 30 segundos para dar tempo ao cold start.

## Arquivos a Modificar

- `src/components/admin/AddBonusCreditsModal.tsx` - Adicionar retry e melhor tratamento de erro

## Verificação de Dados

Os créditos já foram adicionados com sucesso:

| Transação | Valor | Saldo Após | Expira Em |
|-----------|-------|------------|-----------|
| Bônus | +10 | 15 | 15/02/2026 |
| Bônus | +5 | 5 | 15/02/2026 |

O fornecedor `e07bc575-4ed3-42cc-ab8c-1e36baf36643` agora tem 15 créditos bônus disponíveis.

## Estimativa

1 crédito para implementar as melhorias de robustez.
