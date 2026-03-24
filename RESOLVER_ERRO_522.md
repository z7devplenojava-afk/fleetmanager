# 🔧 Resolver Erro 522 - Connection Timeout

## ❌ Problema

O Cloudflare está retornando erro **522 (Connection Timeout)**, o que significa que:
- O Cloudflare conseguiu conectar ao servidor
- Mas o servidor não respondeu a tempo

## 🔍 Diagnóstico Rápido

### Opção 1: Executar Script de Diagnóstico na VPS

```bash
# 1. Conectar na VPS
ssh usuario@IP_VPS

# 2. Ir para o diretório CI
cd /var/www/secured_guard/ci

# 3. Executar diagnóstico
chmod +x /caminho/para/scripts/diagnostico-522.sh
./scripts/diagnostico-522.sh
```

### Opção 2: Verificação Manual

```bash
# 1. Verificar status dos containers
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml ps

# 2. Verificar logs do backend (últimas 50 linhas)
docker logs --tail 50 secured-guard-backend-ci

# 3. Testar backend internamente
curl http://localhost:8081/api/health

# 4. Verificar Traefik
docker ps | grep traefik
docker logs --tail 30 traefik

# 5. Verificar Nginx
docker logs --tail 30 secured-guard-nginx-ci
curl http://localhost:8082/api/health
```

## 🚨 Causas Comuns

### 1️⃣ Backend não está iniciando (mais provável após correção de cache)

**Sintomas:**
- Container em status "Restarting" ou "Unhealthy"
- Logs mostram erro de conflito de beans ou erro de compilação

**Solução:**
```bash
# Verificar logs completos
docker logs secured-guard-backend-ci

# Se houver erro de conflito de beans, verificar se a correção foi aplicada
# A correção já foi commitada e deve estar no repositório

# Reiniciar containers
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml up -d

# Aguardar 2 minutos e verificar novamente
sleep 120
docker logs --tail 50 secured-guard-backend-ci
```

### 2️⃣ Backend está demorando muito para iniciar

**Sintomas:**
- Backend está iniciando mas demora mais de 2 minutos
- Cloudflare timeout é menor que o tempo de inicialização

**Solução:**
```bash
# Verificar se há processos bloqueando
docker exec secured-guard-backend-ci ps aux

# Verificar conexão com banco
docker exec secured-guard-db-ci pg_isready -U postgressg

# Verificar conexão com Redis
docker exec secured-guard-redis-ci redis-cli ping
```

### 3️⃣ Traefik não está roteando corretamente

**Sintomas:**
- Backend responde internamente mas não via HTTPS
- Traefik está rodando mas não está roteando

**Solução:**
```bash
# Verificar configuração do Traefik
docker exec traefik cat /etc/traefik/traefik.yml

# Verificar logs do Traefik
docker logs --tail 50 traefik

# Reiniciar Traefik
docker restart traefik
```

### 4️⃣ Nginx não está respondendo

**Sintomas:**
- Backend responde mas Nginx retorna erro
- Nginx não está conseguindo conectar ao backend

**Solução:**
```bash
# Verificar logs do Nginx
docker logs --tail 50 secured-guard-nginx-ci

# Verificar configuração do Nginx
docker exec secured-guard-nginx-ci cat /etc/nginx/conf.d/default.conf

# Reiniciar Nginx
docker-compose -f docker-compose.ci.yml restart nginx-ci
```

## 🔧 Soluções Imediatas

### Solução 1: Reiniciar Todos os Containers

```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml up -d

# Aguardar inicialização
sleep 120

# Verificar status
docker-compose -f docker-compose.ci.yml ps
```

### Solução 2: Verificar e Aplicar Últimas Mudanças

```bash
cd /var/www/secured_guard/ci

# Fazer backup do .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Atualizar código
git stash
git pull origin ci

# Verificar se há mudanças no docker-compose
git diff HEAD~1 docker-compose.ci.yml

# Reconstruir e reiniciar
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml up -d --build
```

### Solução 3: Verificar Configuração do Cloudflare

1. Acessar painel do Cloudflare
2. Ir em **Speed** → **Optimization**
3. Verificar se **HTTP/2** está habilitado
4. Ir em **Network** → Verificar timeout (deve ser pelo menos 100 segundos)

## 📋 Checklist de Verificação

Execute este checklist na ordem:

- [ ] **Containers estão rodando?**
  ```bash
  docker-compose -f docker-compose.ci.yml ps
  ```
  Todos devem estar "Up" e "healthy"

- [ ] **Backend responde internamente?**
  ```bash
  curl http://localhost:8081/api/health
  ```
  Deve retornar HTTP 200

- [ ] **Nginx responde?**
  ```bash
  curl http://localhost:8082/api/health
  ```
  Deve retornar HTTP 200 ou 302

- [ ] **Traefik está rodando?**
  ```bash
  docker ps | grep traefik
  ```
  Deve mostrar container "Up"

- [ ] **Redis está respondendo?**
  ```bash
  docker exec secured-guard-redis-ci redis-cli ping
  ```
  Deve retornar "PONG"

- [ ] **PostgreSQL está aceitando conexões?**
  ```bash
  docker exec secured-guard-db-ci pg_isready -U postgressg
  ```
  Deve mostrar "accepting connections"

- [ ] **Logs do backend não mostram erros?**
  ```bash
  docker logs --tail 100 secured-guard-backend-ci | grep -i error
  ```
  Não deve mostrar erros críticos

## 🎯 Próximos Passos

1. **Se o backend não está iniciando:**
   - Verificar logs completos: `docker logs secured-guard-backend-ci`
   - Verificar se há conflito de beans (já corrigido no último commit)
   - Verificar se há erros de compilação

2. **Se o backend está iniciando mas demora muito:**
   - Verificar conexão com banco e Redis
   - Verificar se há processos bloqueando
   - Considerar aumentar timeout do Cloudflare

3. **Se tudo está funcionando internamente mas não via HTTPS:**
   - Verificar configuração do Traefik
   - Verificar certificados SSL
   - Verificar configuração do Cloudflare

## 📞 Informações para Suporte

Se o problema persistir, coletar estas informações:

```bash
# Status completo
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml ps > status.txt
docker logs secured-guard-backend-ci > backend-logs.txt
docker logs secured-guard-nginx-ci > nginx-logs.txt
docker logs traefik > traefik-logs.txt

# Enviar arquivos para análise
```

## ✅ Correção Aplicada

A correção do conflito de beans (`CacheConfig` vs `RedisCacheConfig`) já foi commitada e deve resolver o problema de inicialização do backend.

**Commit:** `0bc9b485` - "fix: Resolver conflito de beans entre CacheConfig e RedisCacheConfig"

Após o deploy, o backend deve iniciar corretamente.
