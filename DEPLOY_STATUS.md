# Status do Deploy CI

## Como verificar se o deploy está funcionando:

1. **Verificar se o workflow está sendo executado:**
   - Acesse: https://github.com/zemarioramos/secured-guard/actions
   - Procure pelo workflow "🐳 Deploy CI Environment (Docker Compose)"
   - Verifique se há execuções recentes e se estão completando com sucesso

2. **Se o workflow não está sendo executado:**
   - Verifique se você está fazendo push na branch `ci`
   - Ou execute manualmente: Actions → "🐳 Deploy CI Environment" → "Run workflow"

3. **Se o workflow está falhando:**
   - Clique na execução que falhou
   - Verifique qual step está falhando
   - Verifique os logs para identificar o problema

## Problemas comuns:

### 1. Secrets não configurados
- Verifique se todos os secrets estão configurados em Settings → Secrets and variables → Actions
- Secrets necessários: `VPS_HOST_CI`, `VPS_USER_CI`, `VPS_PASSWORD_CI`, `DOCKER_USERNAME`, `DOCKER_PASSWORD`, etc.

### 2. Imagens Docker não atualizadas
- O workflow remove imagens antigas e faz pull das novas
- Verifique se o build das imagens está sendo feito corretamente
- Verifique se o push para Docker Hub está funcionando

### 3. Containers não recriados
- O workflow usa `--force-recreate --pull always` para garantir atualização
- Verifique os logs do step "🚀 Start new containers"

## Forçar deploy manual:

Se necessário, você pode executar o workflow manualmente:
1. Vá em Actions → "🐳 Deploy CI Environment (Docker Compose)"
2. Clique em "Run workflow"
3. Selecione a branch `ci`
4. Clique em "Run workflow"

