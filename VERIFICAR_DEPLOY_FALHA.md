# 🔍 Como Verificar Por Que o Deploy Está Falhando

## 📋 Passo a Passo

### 1. Acessar os Logs do Workflow
1. Acesse: https://github.com/zmarioramos/secured-guard/actions
2. Clique no workflow mais recente que falhou (o #93 com o commit `e386d55`)
3. Clique no job "🚀 Deploy CI Environment"
4. Expanda os logs dos steps para ver onde está falhando

### 2. Possíveis Causas de Falha Rápida (7 segundos)

#### ❌ Secrets não configurados
Verifique se estes secrets estão configurados no GitHub:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `VPS_HOST`
- `VPS_USER`
- `VPS_PASSWORD`
- `POSTGRES_PASSWORD_CI`
- `REDIS_PASSWORD`
- `JWT_SECRET`

**Como verificar:**
1. Vá em: Settings → Secrets and variables → Actions
2. Verifique se todos os secrets acima estão configurados

#### ❌ Erro no checkout
Se falhar no primeiro step, pode ser problema com permissões do repositório.

#### ❌ Erro de sintaxe YAML
Se houver erro de sintaxe, o workflow nem vai iniciar.

### 3. Workflows Duplicados

Você tem DOIS workflows configurados para a mesma branch `ci`:
- `deploy-ci-docker.yml` (mais completo)
- `deploy-ci-only.yml` (simplificado)

**Recomendação:**
- Desabilitar um deles para evitar conflitos
- Manter apenas o `deploy-ci-docker.yml` que é mais completo

### 4. Como Desabilitar um Workflow

Para desabilitar temporariamente o `deploy-ci-only.yml`:

1. Renomeie o arquivo para `.yml.disabled`
2. Ou remova o trigger `push` deixando apenas `workflow_dispatch`

### 5. Verificar Logs Específicos

No GitHub Actions, procure por estas mensagens de erro comuns:
- ❌ "Secret not found" → Falta configurar secrets
- ❌ "Permission denied" → Problema de permissões
- ❌ "Invalid YAML" → Erro de sintaxe
- ❌ "Container failed" → Problema com Docker
- ❌ "SSH connection failed" → Problema de conexão com VPS

## 🔧 Solução Rápida

### Opção 1: Desabilitar workflow duplicado

Renomeie `.github/workflows/deploy-ci-only.yml` para:
```
.github/workflows/deploy-ci-only.yml.disabled
```

Isso fará com que apenas o `deploy-ci-docker.yml` seja executado.

### Opção 2: Verificar secrets

Certifique-se de que todos os secrets estão configurados em:
**Settings → Secrets and variables → Actions**

### Opção 3: Executar workflow manualmente

1. Acesse: https://github.com/zmarioramos/secured-guard/actions
2. Selecione o workflow "🐳 Deploy CI Environment (Docker Compose)"
3. Clique em "Run workflow"
4. Selecione a branch `ci`
5. Clique em "Run workflow"

## 📞 Próximos Passos

1. ✅ Verificar logs no GitHub Actions
2. ✅ Verificar se secrets estão configurados
3. ✅ Desabilitar workflow duplicado se necessário
4. ✅ Tentar executar workflow manualmente

