# 🔍 Como Diagnosticar Falhas no Deploy

## 📋 Passo a Passo

### 1. Executar Workflow de Diagnóstico

1. Acesse: https://github.com/zmarioramos/secured-guard/actions
2. Clique em: **"🔍 Diagnóstico de Falhas no Deploy"**
3. Clique em: **"Run workflow"** (canto superior direito)
4. Selecione branch: **`ci`**
5. Clique em: **"Run workflow"**

### 2. Verificar Resultados

O workflow testa:
- ✅ **Build do Backend** (Maven)
- ✅ **Build do Frontend** (Vite)
- ✅ **Build das Imagens Docker**
- ✅ **Secrets do GitHub**

### 3. Interpretar Resultados

#### ✅ Todos os testes passaram
**Significa:** O problema está no **deploy** ou **health check**, não no build.

**Próximos passos:**
1. Verificar logs do workflow principal `deploy-ci-docker.yml`
2. Verificar se o problema está no step de SSH/VPS
3. Verificar se o problema está no health check

#### ❌ Build do Backend falhou
**Possíveis causas:**
- Erros de compilação Java
- Dependências Maven não encontradas
- Problemas com Flyway migrations

**Solução:**
1. Ver logs do Maven no workflow
2. Verificar se há erros de sintaxe no código
3. Verificar se as migrations estão corretas

#### ❌ Build do Frontend falhou
**Possíveis causas:**
- Erros de compilação TypeScript/React
- Dependências npm não encontradas
- Variáveis de ambiente faltando

**Solução:**
1. Ver logs do npm/Vite no workflow
2. Verificar se `package-lock.json` está atualizado
3. Verificar se há erros de sintaxe no código

#### ❌ Build Docker falhou
**Possíveis causas:**
- Dockerfiles não encontrados
- Erros no Dockerfile
- Problemas com build args

**Solução:**
1. Verificar se os Dockerfiles existem:
   - `backend/Dockerfile.prod`
   - `frontend/Dockerfile.prod`
2. Verificar logs do Docker build
3. Verificar se os build args estão corretos

#### ❌ Secrets faltando
**Possíveis causas:**
- Secrets não configurados no GitHub
- Secrets com nomes incorretos

**Solução:**
1. Ir em: Settings → Secrets and variables → Actions
2. Verificar se todos os secrets estão configurados:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `VPS_HOST`
   - `VPS_USER`
   - `VPS_PASSWORD`
   - `POSTGRES_PASSWORD_CI`
   - `REDIS_PASSWORD`
   - `JWT_SECRET`

## 🔧 Correções Aplicadas

### Workflow Principal (`deploy-ci-docker.yml`)

1. **Melhor tratamento de erros nos builds:**
   - Adicionado `continue-on-error: false` nos builds críticos
   - Mensagens de erro mais detalhadas
   - Verificação de arquivos após build

2. **Logging melhorado:**
   - Logs mais informativos em cada step
   - Verificação de existência de arquivos
   - Mensagens de erro mais claras

## 📊 Próximos Passos

Após executar o workflow de diagnóstico:

1. **Se o diagnóstico passar:**
   - O problema está no deploy ou health check
   - Verificar logs do workflow principal
   - Verificar conectividade com VPS
   - Verificar se Traefik está rodando

2. **Se o diagnóstico falhar:**
   - Corrigir o problema específico identificado
   - Executar o diagnóstico novamente
   - Só depois executar o deploy completo

## 🆘 Ainda com Problemas?

Se o diagnóstico não identificar o problema:

1. **Ver logs completos do workflow principal:**
   - Acesse: https://github.com/zmarioramos/secured-guard/actions
   - Clique no workflow que falhou
   - Expanda cada step para ver logs detalhados

2. **Verificar logs no servidor:**
   ```bash
   ssh usuario@servidor
   cd /var/www/secured_guard/ci
   docker-compose -f docker-compose.ci.yml logs --tail 100
   ```

3. **Verificar status dos containers:**
   ```bash
   docker-compose -f docker-compose.ci.yml ps
   ```

