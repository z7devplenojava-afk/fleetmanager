# 🚨 DEPLOY URGENTE - Correção NGINX CI

## 📋 Problema Identificado

**Erro:** 405 Method Not Allowed no endpoint `/api/auth/login`

**Causa:** Configuração incorreta do NGINX no arquivo `nginx/ci.conf`:

1. ❌ **Porta incorreta:** `backend-ci:8082` (deveria ser `8081`)
2. ❌ **Path incorreto:** `proxy_pass http://backend` (remove o `/api/`)

## ✅ Correções Aplicadas

### Arquivo: `nginx/ci.conf`

**Mudanças:**
- ✅ Linha 37: `server backend-ci:8081;` (era 8082)
- ✅ Linha 66: `proxy_pass http://backend/api/;` (mantém o /api/)
- ✅ Linha 85: `proxy_pass http://backend/ws/;` (mantém o /ws/)
- ✅ Linha 102: `proxy_pass http://backend/api/auth/;` (mantém o /api/auth/)
- ✅ Linha 111: `proxy_pass http://backend/uploads/;` (mantém o /uploads/)

## 🚀 Deploy no Servidor CI

### Opção 1: Via Git (Recomendado se usar nginx em container)

```bash
# 1. No seu computador local, faça commit das mudanças
git add nginx/ci.conf
git commit -m "fix: corrige configuração nginx CI - porta 8081 e paths corretos"
git push origin ci

# 2. No servidor CI, faça pull das mudanças
ssh usuario@ci.z7botsolutions.com.br
cd /path/to/secured-guard
git pull origin ci

# 3. Se estiver usando nginx em container:
docker cp nginx/ci.conf <nome-container-nginx>:/etc/nginx/nginx.conf
docker exec <nome-container-nginx> nginx -t
docker exec <nome-container-nginx> nginx -s reload

# 4. Se nginx estiver no host:
sudo cp nginx/ci.conf /etc/nginx/sites-available/secured-guard-ci.conf
sudo nginx -t
sudo systemctl reload nginx
```

### Opção 2: Manual (Mais Rápido)

```bash
# 1. Conectar ao servidor CI
ssh usuario@ci.z7botsolutions.com.br

# 2. Verificar qual configuração está sendo usada
# Opção A: Nginx em container
docker ps | grep nginx

# Opção B: Nginx no host
sudo nginx -V
sudo ls -la /etc/nginx/sites-enabled/

# 3a. Se nginx está em CONTAINER:
# Editar diretamente no container
docker exec -it <nome-container-nginx> vi /etc/nginx/nginx.conf

# Ou copiar arquivo corrigido
docker cp nginx/ci.conf <nome-container-nginx>:/etc/nginx/nginx.conf

# 3b. Se nginx está no HOST:
sudo nano /etc/nginx/sites-available/secured-guard-ci.conf

# 4. Aplicar as mudanças:
# CONTAINER:
docker exec <nome-container-nginx> nginx -t
docker exec <nome-container-nginx> nginx -s reload

# HOST:
sudo nginx -t
sudo systemctl reload nginx
```

### Opção 3: Usando Traefik (Se aplicável)

Se o ambiente CI estiver usando **Traefik** ao invés de nginx (verificar labels no docker-compose.ci.yml):

```bash
# Verificar se está usando Traefik
docker ps | grep traefik

# Se sim, o problema pode ser no Traefik, não no nginx
# Neste caso, verifique:
docker logs traefik

# Verifique se o backend está rodando
docker ps | grep backend-ci
docker logs secured-guard-backend-ci --tail 100

# Teste direto no container do backend
docker exec -it secured-guard-backend-ci curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}'
```

## 🔬 Verificação Pós-Deploy

### 1. Testar no Servidor

```bash
# Teste 1: Health check
curl http://localhost/health

# Teste 2: Login (deve retornar 401 ou 200, NÃO 405)
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}' \
  -v

# Teste 3: Verificar logs do backend
docker logs secured-guard-backend-ci --tail 50

# Teste 4: Verificar se backend está respondendo
docker exec -it secured-guard-backend-ci curl http://localhost:8081/api/health
```

### 2. Verificar Status dos Containers

```bash
# Ver todos os containers do CI
docker ps --filter name=secured-guard

# Verificar logs
docker logs secured-guard-backend-ci --tail 100
docker logs secured-guard-frontend-ci --tail 50

# Se houver nginx container:
docker logs <nome-nginx-container> --tail 50
```

### 3. Teste do Frontend

Acesse: https://ci.z7botsolutions.com.br

**Login:**
- Username: `jose.ramos`
- Password: `Admin1234`

**Resultado esperado:**
- ✅ Login bem-sucedido OU erro de credenciais inválidas (401)
- ❌ NÃO deve retornar 405 Method Not Allowed

## 🐛 Troubleshooting

### Se ainda retornar 405:

**1. Verificar qual serviço está retornando o 405:**

```bash
# Ver headers da resposta
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}' \
  -I

# Procurar por: "Server: nginx" ou "Server: cloudflare"
```

**2. Se retornar "Server: cloudflare":**

O Cloudflare pode estar cacheando ou bloqueando. Verificar:
- Painel do Cloudflare > Regras de Firewall
- Painel do Cloudflare > Regras de Página
- Painel do Cloudflare > SSL/TLS (deve ser "Full" ou "Full (strict)")

**3. Se o backend não estiver respondendo:**

```bash
# Verificar se backend está rodando
docker ps | grep backend-ci

# Se não estiver, iniciar:
cd /path/to/secured-guard
docker-compose -f docker-compose.ci.yml up -d backend-ci

# Verificar logs de inicialização
docker logs secured-guard-backend-ci -f
```

**4. Verificar conectividade entre nginx e backend:**

```bash
# Se nginx está em container:
docker exec -it <nginx-container> ping backend-ci
docker exec -it <nginx-container> nc -zv backend-ci 8081

# Verificar se estão na mesma rede:
docker network inspect secured-guard-ci
```

## 📊 Logs Úteis

```bash
# Backend logs
docker logs secured-guard-backend-ci --tail 100 -f

# Nginx logs (se em container)
docker logs <nginx-container> --tail 100 -f

# Traefik logs (se aplicável)
docker logs traefik --tail 100 -f

# Verificar logs do sistema
sudo journalctl -u nginx -f
sudo journalctl -u docker -f
```

## ✅ Validação Final

Após todas as correções, execute:

```bash
# Teste completo
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -o response.json

cat response.json

# Deve retornar:
# - 200 com token JWT (se credenciais corretas)
# - 401 Unauthorized (se credenciais incorretas)
# NÃO deve retornar 405 Method Not Allowed
```

## 📞 Suporte

Se o problema persistir, verificar:
1. ✅ Backend está rodando? (`docker ps | grep backend-ci`)
2. ✅ Porta 8081 está acessível? (`docker exec backend-ci curl localhost:8081/api/health`)
3. ✅ Nginx/Traefik está roteando corretamente?
4. ✅ Cloudflare não está bloqueando?
5. ✅ Firewall do servidor permite a porta 8081?

---

**Última atualização:** 28/10/2025  
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado de correção:** 5-10 minutos

