# 🔧 Solução Final: Erro 405 no Login CI

## 🎯 Problema

```
❌ POST https://ci.z7botsolutions.com.br/api/auth/login
❌ Status: 405 Not Allowed
❌ Server: nginx/1.29.3 (Traefik)
```

## 🔍 Causa Raiz Identificada

O **Traefik** está bloqueando requisições POST devido a:

1. **Middlewares complexos** causando conflitos
2. **Headers CORS restritivos** bloqueando métodos HTTP
3. **Strip prefix** removendo `/api` e causando problemas de roteamento

## ✅ Solução Aplicada

### Simplificação Radical do docker-compose.ci.yml

**Mudanças:**

1. ✅ **CORS simplificado** - usando `*` para permitir tudo
2. ✅ **Removido stripprefix** - deixar o backend lidar com `/api`
3. ✅ **Removido headers customizados** - evitar conflitos
4. ✅ **Apenas 1 middleware** - somente CORS

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.backend-ci.rule=Host(`ci.z7botsolutions.com.br`) && PathPrefix(`/api`)"
  - "traefik.http.routers.backend-ci.entrypoints=websecure"
  - "traefik.http.routers.backend-ci.tls.certresolver=letsencryptresolver"
  - "traefik.http.routers.backend-ci.service=backend-ci"
  - "traefik.http.routers.backend-ci.priority=100"
  - "traefik.http.services.backend-ci.loadbalancer.server.port=8081"
  - "traefik.http.services.backend-ci.loadbalancer.passhostheader=true"
  # CORS Middleware - SIMPLIFICADO
  - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolalloworiginlistregex=.*"
  - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowmethods=*"
  - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowheaders=*"
  - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowcredentials=true"
  - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolmaxage=3600"
  - "traefik.http.middlewares.backend-ci-cors.headers.addvaryheader=true"
  # Aplicar apenas CORS middleware
  - "traefik.http.routers.backend-ci.middlewares=backend-ci-cors"
```

## 🚀 Deploy

### Via GitHub Actions (Automático)

```bash
git add docker-compose.ci.yml .github/workflows/deploy-ci-only.yml
git commit -m "fix: simplificar Traefik CORS para corrigir erro 405"
git push origin main:ci
```

### Manual no Servidor (Emergência)

```bash
# SSH no servidor
ssh usuario@ci.z7botsolutions.com.br

# Ir para o diretório
cd /var/www/secured_guard/ci

# Fazer backup
cp docker-compose.ci.yml docker-compose.ci.yml.backup.$(date +%Y%m%d_%H%M%S)

# Editar o arquivo (copiar as labels acima)
nano docker-compose.ci.yml

# Recriar container
docker-compose down
docker-compose up -d --force-recreate

# Aguardar 30 segundos
sleep 30

# Testar
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v
```

## 🧪 Validação

### 1. Teste OPTIONS (Preflight)

```bash
curl -X OPTIONS https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Esperado:** HTTP 204 ou 200 com headers CORS

### 2. Teste POST (Login)

```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -d '{"username":"jose.ramos","password":"sua_senha"}' \
  -v
```

**Esperado:** HTTP 401 (credenciais inválidas) ou HTTP 200 (sucesso)  
**NÃO deve retornar:** HTTP 405

### 3. Teste no Frontend

1. Acesse: https://ci.z7botsolutions.com.br
2. Abra DevTools (F12) → Console
3. Tente fazer login
4. Verifique que não há mais erro 405

## 📊 Logs para Verificação

### Backend

```bash
docker logs secured-guard-backend-ci --tail 100 -f
```

Procure por:
```
POST /api/auth/login
```

### Traefik

```bash
docker logs traefik --tail 100 -f
```

Procure por:
```
backend-ci
```

## 🔄 Se Ainda Não Funcionar

### Opção 1: Desabilitar Traefik temporariamente

Editar `docker-compose.ci.yml` e remover TODAS as labels do backend-ci, deixando apenas:

```yaml
labels:
  - "traefik.enable=false"
```

Isso fará o backend responder diretamente na porta 8081.

### Opção 2: Verificar configuração do Traefik

```bash
# Ver configuração do Traefik
docker exec traefik cat /etc/traefik/traefik.yml

# Ver rotas ativas
curl http://localhost:8080/api/http/routers
```

### Opção 3: Testar diretamente no backend (bypass Traefik)

```bash
# Dentro do servidor
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

Se funcionar, o problema é 100% no Traefik.

## 📝 Checklist

- [ ] Commit e push para branch `ci`
- [ ] GitHub Actions executou com sucesso
- [ ] Container backend-ci foi recriado
- [ ] Teste OPTIONS retorna 204/200
- [ ] Teste POST retorna 401/200 (não 405)
- [ ] Login no frontend funciona
- [ ] Sem erros 405 no console do navegador

## 🎯 Resultado Esperado

```
✅ POST /api/auth/login → HTTP 200/401
✅ OPTIONS /api/auth/login → HTTP 204/200
✅ CORS headers presentes
✅ Login funcionando
✅ Sem erro 405
```

---

**Data:** 29/10/2025  
**Tentativa:** 3 (Simplificação radical)  
**Status:** Pronto para deploy  
**Prioridade:** 🔴 CRÍTICA
