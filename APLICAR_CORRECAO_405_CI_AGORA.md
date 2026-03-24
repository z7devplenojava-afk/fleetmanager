# 🚨 APLICAR CORREÇÃO 405 NO CI - URGENTE

## Problema
```
POST /auth/login → 405 Not Allowed
nginx/1.29.3
```

## Solução Rápida (SSH no servidor CI)

### Opção 1: Recarregar NGINX (Mais Rápido)

```bash
# 1. Conectar no servidor CI
ssh usuario@ci.z7botsolutions.com.br

# 2. Ir para o diretório do projeto
cd /var/www/secured_guard

# 3. Fazer pull das alterações
git pull origin main

# 4. Recarregar NGINX
docker exec secured-guard-nginx-ci nginx -t
docker exec secured-guard-nginx-ci nginx -s reload

# 5. Testar
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Opção 2: Reiniciar Container NGINX

```bash
# No servidor CI
cd /var/www/secured_guard/deploy
docker-compose restart nginx
```

### Opção 3: Script Automático

```bash
# No servidor CI
cd /var/www/secured_guard
bash fix-ci-login-405.sh
```

## O que foi corrigido no nginx-ci.conf

### Antes (Problema)
```nginx
location /api/ {
    limit_req zone=api burst=10 nodelay;
    
    # CORS headers dentro do bloco
    add_header 'Access-Control-Allow-Origin' '*' always;
    
    # if statement quebrava os headers
    if ($request_method = 'OPTIONS') {
        # ...
    }
}
```

### Depois (Corrigido)
```nginx
location /api/ {
    # Rate limiting mais permissivo
    limit_req zone=api burst=20 nodelay;
    
    # Handle preflight FIRST
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    # Proxy to backend
    proxy_pass http://backend_ci/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers for all responses
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

## Principais Mudanças

1. ✅ **Rate limiting aumentado:** `burst=10` → `burst=20`
2. ✅ **Métodos HTTP explícitos:** Adicionado `POST, PUT, DELETE, PATCH`
3. ✅ **Headers CORS com `always`:** Garante que headers sejam enviados mesmo em erros
4. ✅ **Preflight tratado primeiro:** `if ($request_method = 'OPTIONS')` no topo
5. ✅ **Buffer desabilitado:** Evita problemas com requisições grandes

## Verificação

### 1. Verificar se NGINX está usando a nova configuração

```bash
# Ver configuração ativa
docker exec secured-guard-nginx-ci cat /etc/nginx/nginx.conf | grep -A 30 "location /api/"

# Testar sintaxe
docker exec secured-guard-nginx-ci nginx -t
```

### 2. Testar endpoint de login

```bash
# Deve retornar 401 (credenciais inválidas) ou 200 (sucesso)
# NÃO deve retornar 405
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"sua_senha"}' \
  -v
```

### 3. Verificar logs do NGINX

```bash
docker logs secured-guard-nginx-ci --tail 50
```

### 4. Verificar logs do backend

```bash
docker logs secured-guard-backend-ci --tail 50 | grep "auth/login"
```

## Troubleshooting

### Se ainda retornar 405

1. **Verificar se o arquivo foi atualizado:**
```bash
cat /var/www/secured_guard/deploy/nginx/nginx-ci.conf | grep "burst=20"
```

2. **Verificar se volume está montado corretamente:**
```bash
docker inspect secured-guard-nginx-ci | grep -A 5 "Mounts"
```

3. **Reiniciar container completamente:**
```bash
docker-compose down nginx
docker-compose up -d nginx
```

4. **Verificar se há outro proxy na frente (Traefik):**
```bash
docker ps | grep traefik
```

### Se usar Traefik

Se o ambiente CI usa Traefik em vez de NGINX:

```bash
# Verificar labels do backend
docker inspect secured-guard-backend-ci | grep -A 20 "Labels"

# Verificar logs do Traefik
docker logs traefik --tail 50
```

## Checklist de Aplicação

- [ ] Conectar no servidor CI via SSH
- [ ] Fazer `git pull` para pegar alterações
- [ ] Verificar se arquivo `nginx-ci.conf` foi atualizado
- [ ] Recarregar NGINX: `docker exec secured-guard-nginx-ci nginx -s reload`
- [ ] Testar login: deve retornar 401 ou 200, NÃO 405
- [ ] Verificar logs para confirmar
- [ ] Testar no navegador

## Comandos Completos (Copy & Paste)

```bash
# Conectar e aplicar correção
ssh usuario@ci.z7botsolutions.com.br << 'EOF'
cd /var/www/secured_guard
git pull origin main
docker exec secured-guard-nginx-ci nginx -t && \
docker exec secured-guard-nginx-ci nginx -s reload
echo "✅ NGINX recarregado"

# Testar
sleep 2
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -w "\nHTTP Status: %{http_code}\n"
EOF
```

## Resultado Esperado

```bash
HTTP Status: 401  # ✅ Credenciais inválidas (esperado)
# ou
HTTP Status: 200  # ✅ Login bem-sucedido
```

**NÃO deve retornar:**
```bash
HTTP Status: 405  # ❌ Method Not Allowed
```

---

**Prioridade:** 🔴 CRÍTICA  
**Impacto:** Login bloqueado no ambiente CI  
**Tempo estimado:** 2-5 minutos  
**Última atualização:** 28/10/2025 23:30
