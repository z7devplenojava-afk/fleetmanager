# 🔧 Solução: Erro 405 no Login CI (Traefik)

## 🎯 Problema Identificado

```
❌ POST https://ci.z7botsolutions.com.br/api/auth/login
❌ Status: 405 Not Allowed
❌ Server: nginx/1.29.3 (na verdade é Traefik)
```

## 🔍 Causa Raiz

O **Traefik** está interceptando as requisições e bloqueando o método POST devido a:

1. **Ordem incorreta dos middlewares** - CORS deve vir antes dos headers customizados
2. **Headers CORS incompletos** - faltavam headers importantes como `Origin` e `Accept`
3. **Configuração de CORS não estava sendo aplicada corretamente**

## ✅ Correção Aplicada

### Arquivo: `docker-compose.ci.yml`

**Antes:**
```yaml
- "traefik.http.routers.backend-ci.middlewares=backend-ci-headers,backend-ci-cors"
- "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowheaders=*"
```

**Depois:**
```yaml
- "traefik.http.routers.backend-ci.middlewares=backend-ci-cors,backend-ci-headers"
- "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowheaders=DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin"
```

### Mudanças principais:

1. ✅ **Ordem dos middlewares invertida** - CORS primeiro, depois headers
2. ✅ **Headers CORS explícitos** - substituído `*` por lista específica
3. ✅ **Max-Age aumentado** - de 100 para 3600 segundos
4. ✅ **Removido header problemático** - `X-Forwarded-For` vazio

## 🚀 Como Aplicar no Servidor CI

### Opção 1: Script Automático (Recomendado)

```bash
# No servidor CI
cd /var/www/secured_guard

# Tornar o script executável
chmod +x fix-405-ci-traefik.sh

# Executar
./fix-405-ci-traefik.sh
```

### Opção 2: Manual

```bash
# No servidor CI
cd /var/www/secured_guard

# Fazer backup
cp docker-compose.ci.yml docker-compose.ci.yml.backup

# Fazer pull das alterações do Git
git pull origin main

# Recriar o container backend
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci

# Aguardar 10 segundos
sleep 10

# Testar
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 🧪 Testes de Validação

### 1. Teste de Preflight (OPTIONS)

```bash
curl -X OPTIONS https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Resposta esperada:**
```
< HTTP/2 204
< access-control-allow-origin: https://ci.z7botsolutions.com.br
< access-control-allow-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD
< access-control-allow-headers: DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin
< access-control-allow-credentials: true
< access-control-max-age: 3600
```

### 2. Teste de Login (POST)

```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -d '{"username":"jose.ramos","password":"sua_senha"}' \
  -v
```

**Resposta esperada:**
- ✅ HTTP 401 (credenciais inválidas) - OK, endpoint está funcionando
- ✅ HTTP 200 (credenciais válidas) - OK, login bem-sucedido
- ❌ HTTP 405 - Problema ainda existe

### 3. Teste no Frontend

1. Acesse: https://ci.z7botsolutions.com.br
2. Abra o DevTools (F12)
3. Vá para a aba Console
4. Tente fazer login
5. Verifique se não há mais erro 405

## 📊 Verificação de Logs

### Logs do Backend

```bash
docker logs secured-guard-backend-ci --tail 100 -f
```

Procure por:
```
POST /api/auth/login
```

### Logs do Traefik

```bash
docker logs traefik --tail 100 -f
```

Procure por:
```
backend-ci
```

## 🔄 Rollback (se necessário)

Se algo der errado:

```bash
cd /var/www/secured_guard

# Restaurar backup
cp docker-compose.ci.yml.backup docker-compose.ci.yml

# Recriar container
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci
```

## 📝 Checklist de Validação

- [ ] Script executado sem erros
- [ ] Container backend-ci recriado
- [ ] Backend está saudável (health check)
- [ ] Teste OPTIONS retorna 204
- [ ] Teste POST retorna 401 ou 200 (não 405)
- [ ] Login no frontend funciona
- [ ] Logs do backend mostram requisições chegando

## 🎯 Resultado Esperado

Após aplicar a correção:

```
✅ POST /api/auth/login → HTTP 200/401 (não mais 405)
✅ OPTIONS /api/auth/login → HTTP 204
✅ CORS headers presentes nas respostas
✅ Login no frontend funcionando
```

## 🚨 Troubleshooting

### Se ainda retornar 405:

1. **Verificar se o Traefik está rodando:**
   ```bash
   docker ps | grep traefik
   ```

2. **Verificar labels do container:**
   ```bash
   docker inspect secured-guard-backend-ci | grep -A 20 Labels
   ```

3. **Verificar rede do Traefik:**
   ```bash
   docker network inspect z7network
   ```

4. **Testar diretamente no backend (bypass Traefik):**
   ```bash
   curl -X POST http://localhost:8081/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

### Se o backend não responder:

1. **Verificar logs:**
   ```bash
   docker logs secured-guard-backend-ci --tail 200
   ```

2. **Verificar se o banco está acessível:**
   ```bash
   docker exec secured-guard-backend-ci pg_isready -h postgres-ci -U secured_guard_ci
   ```

3. **Reiniciar todos os serviços:**
   ```bash
   docker-compose -f docker-compose.ci.yml restart
   ```

---

**Data:** 29/10/2025  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ Correção pronta para deploy  
**Impacto:** Login bloqueado no ambiente CI
