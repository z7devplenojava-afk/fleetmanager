# 🔧 Troubleshooting: Erro 405 no Login CI

## 🔍 Problema Identificado

```
POST https://ci.z7botsolutions.com.br/api/auth/login
Status: 405 Not Allowed
nginx/1.29.2
```

## 📋 Diagnóstico

O erro 405 indica que o método HTTP POST não está sendo permitido pelo proxy reverso (NGINX ou Traefik) no ambiente CI.

### Possíveis Causas:

1. **NGINX bloqueando método POST**
2. **Traefik sem configuração de CORS adequada**
3. **Conflito entre NGINX e Traefik**
4. **Rate limiting muito restritivo**

## ✅ Soluções

### Solução 1: Verificar qual proxy está ativo

```bash
# No servidor CI, verificar containers rodando
docker ps | grep -E "nginx|traefik"

# Verificar logs do NGINX
docker logs secured-guard-nginx-ci --tail 100

# Verificar logs do Traefik
docker logs traefik --tail 100
```

### Solução 2: Corrigir NGINX (se estiver usando NGINX)

O arquivo `deploy/nginx/nginx-ci.conf` já foi corrigido com:

```nginx
location /api/ {
    # Rate limiting mais permissivo
    limit_req zone=api burst=20 nodelay;
    
    # Handle preflight requests FIRST
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    proxy_pass http://backend_ci/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Buffer settings
    proxy_buffering off;
    proxy_request_buffering off;
}
```

**Aplicar correção:**

```bash
# No servidor CI
cd /var/www/secured_guard/deploy

# Recarregar NGINX
docker exec secured-guard-nginx-ci nginx -t
docker exec secured-guard-nginx-ci nginx -s reload

# OU reiniciar container
docker restart secured-guard-nginx-ci
```

### Solução 3: Usar Traefik (recomendado para CI)

Se o ambiente CI deve usar Traefik, adicionar labels corretas no `docker-compose.ci.yml`:

```yaml
backend:
  # ... outras configurações ...
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.backend-ci.rule=Host(`ci.z7botsolutions.com.br`) && PathPrefix(`/api`)"
    - "traefik.http.routers.backend-ci.entrypoints=websecure"
    - "traefik.http.routers.backend-ci.tls.certresolver=letsencryptresolver"
    - "traefik.http.services.backend-ci.loadbalancer.server.port=8080"
    
    # CORS Middleware
    - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolalloworiginlist=*"
    - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowmethods=GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD"
    - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowheaders=*"
    - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowcredentials=true"
    - "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolmaxage=100"
    - "traefik.http.middlewares.backend-ci-cors.headers.addvaryheader=true"
    
    # Aplicar middleware
    - "traefik.http.routers.backend-ci.middlewares=backend-ci-cors"
```

**Aplicar:**

```bash
cd /var/www/secured_guard/deploy
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend
```

### Solução 4: Verificar SecurityConfig do Backend

O `SecurityConfig.java` já está correto:

```java
.requestMatchers("/api/auth/**").permitAll()
```

### Solução 5: Teste direto no backend (bypass proxy)

```bash
# Testar diretamente no container backend
docker exec -it secured-guard-backend-ci curl -X POST \
  http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"sua_senha"}'
```

Se funcionar, o problema é no proxy. Se não funcionar, o problema é no backend.

## 🔍 Verificações Adicionais

### 1. Verificar logs em tempo real

```bash
# NGINX
docker logs -f secured-guard-nginx-ci

# Backend
docker logs -f secured-guard-backend-ci

# Traefik (se existir)
docker logs -f traefik
```

### 2. Verificar configuração de rede

```bash
# Verificar se containers estão na mesma rede
docker network inspect secured-guard

# Testar conectividade
docker exec secured-guard-nginx-ci ping -c 3 secured-guard-backend-ci
```

### 3. Verificar variáveis de ambiente do frontend

```bash
docker exec secured-guard-frontend-ci env | grep VITE
```

Deve mostrar:
```
VITE_API_URL=https://ci.z7botsolutions.com.br/api
```

## 🎯 Checklist de Correção

- [ ] Identificar qual proxy está ativo (NGINX ou Traefik)
- [ ] Verificar logs do proxy para confirmar erro 405
- [ ] Aplicar correção no proxy ativo
- [ ] Reiniciar/recarregar proxy
- [ ] Testar login novamente
- [ ] Verificar logs do backend para confirmar recebimento da requisição
- [ ] Se necessário, testar bypass do proxy

## 📞 Próximos Passos

1. **Acesse o servidor CI** via SSH
2. **Execute os comandos de diagnóstico** acima
3. **Aplique a solução** apropriada
4. **Teste o login** novamente

## 🚨 Solução Rápida (Emergency)

Se precisar de acesso imediato, pode temporariamente:

```bash
# Desabilitar rate limiting no NGINX
# Editar nginx-ci.conf e comentar:
# limit_req zone=api burst=20 nodelay;

# Recarregar
docker exec secured-guard-nginx-ci nginx -s reload
```

---

**Última atualização:** 28/10/2025
**Status:** Aguardando aplicação no servidor CI
