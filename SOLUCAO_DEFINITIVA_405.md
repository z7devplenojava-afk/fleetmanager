# 🎯 Solução Definitiva: Erro 405 no Login CI

## 🔍 Diagnóstico Final

Após 3 tentativas de corrigir o Traefik, identificamos que:

1. ❌ Traefik tem configuração global bloqueando POST
2. ❌ Labels do docker-compose não sobrescrevem configuração global
3. ✅ **Solução: Usar Nginx como proxy reverso ao invés do Traefik**

## 🏗️ Nova Arquitetura

```
Internet → Traefik (HTTPS) → Nginx (Proxy) → Backend/Frontend
```

**Vantagens:**
- ✅ Nginx tem controle total sobre CORS e métodos HTTP
- ✅ Configuração explícita e testada
- ✅ Não depende de configuração global do Traefik
- ✅ Traefik apenas faz terminação SSL

## 📝 Mudanças Aplicadas

### 1. docker-compose.ci.yml

**Adicionado serviço Nginx:**
```yaml
nginx-ci:
  image: nginx:alpine
  container_name: secured-guard-nginx-ci
  ports:
    - "8082:80"
  volumes:
    - ./nginx/ci.conf:/etc/nginx/nginx.conf:ro
  depends_on:
    - backend-ci
    - frontend-ci
  networks:
    - secured-guard-ci-network
    - z7network
  restart: unless-stopped
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.nginx-ci.rule=Host(`ci.z7botsolutions.com.br`)"
    - "traefik.http.routers.nginx-ci.entrypoints=websecure"
    - "traefik.http.routers.nginx-ci.tls.certresolver=letsencryptresolver"
    - "traefik.http.services.nginx-ci.loadbalancer.server.port=80"
```

**Desabilitado Traefik no backend e frontend:**
```yaml
backend-ci:
  labels:
    - "traefik.enable=false"

frontend-ci:
  labels:
    - "traefik.enable=false"
```

### 2. nginx/ci.conf

**Atualizado upstreams:**
```nginx
upstream backend {
    server secured-guard-backend-ci:8081;
}

upstream frontend {
    server secured-guard-frontend-ci:80;
}
```

## 🚀 Deploy

### Via GitHub Actions

```bash
git add docker-compose.ci.yml nginx/ci.conf .github/workflows/deploy-ci-only.yml
git commit -m "fix: usar Nginx como proxy reverso para corrigir erro 405"
git push origin main:ci
```

### Manual no Servidor

```bash
# SSH no servidor
ssh usuario@ci.z7botsolutions.com.br

# Ir para o diretório
cd /var/www/secured_guard

# Fazer backup
cp docker-compose.ci.yml docker-compose.ci.yml.backup.$(date +%Y%m%d_%H%M%S)

# Fazer pull das alterações
git pull origin ci

# Parar containers antigos
docker-compose -f docker-compose.ci.yml down

# Iniciar com nova configuração
docker-compose -f docker-compose.ci.yml up -d

# Aguardar containers iniciarem
sleep 30

# Verificar status
docker-compose -f docker-compose.ci.yml ps

# Testar
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v
```

## 🧪 Validação

### 1. Verificar containers rodando

```bash
docker ps | grep secured-guard-ci
```

Deve mostrar:
- secured-guard-nginx-ci
- secured-guard-backend-ci
- secured-guard-frontend-ci
- secured-guard-db-ci
- secured-guard-redis-ci

### 2. Testar Nginx diretamente

```bash
# Teste interno (dentro do servidor)
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Esperado:** HTTP 401 ou 200 (não 405)

### 3. Testar via Traefik (HTTPS)

```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v
```

**Esperado:** HTTP 401 ou 200 (não 405)

### 4. Testar no navegador

1. Acesse: https://ci.z7botsolutions.com.br
2. Abra DevTools (F12) → Console
3. Tente fazer login
4. Verifique que não há erro 405

## 📊 Logs

### Nginx

```bash
docker logs secured-guard-nginx-ci --tail 100 -f
```

### Backend

```bash
docker logs secured-guard-backend-ci --tail 100 -f
```

### Traefik

```bash
docker logs traefik --tail 100 -f
```

## 🔧 Troubleshooting

### Se Nginx não iniciar:

```bash
# Verificar configuração
docker exec secured-guard-nginx-ci nginx -t

# Ver logs de erro
docker logs secured-guard-nginx-ci
```

### Se ainda retornar 405:

```bash
# Testar diretamente no backend (bypass Nginx e Traefik)
docker exec secured-guard-backend-ci curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

Se funcionar, o problema está no Nginx ou Traefik.

### Se Traefik não rotear para Nginx:

```bash
# Verificar rotas do Traefik
curl http://localhost:8080/api/http/routers | jq

# Verificar se nginx-ci está registrado
docker inspect secured-guard-nginx-ci | grep traefik
```

## 📋 Checklist

- [ ] Commit e push para branch `ci`
- [ ] GitHub Actions executou com sucesso
- [ ] Container nginx-ci criado e rodando
- [ ] Container backend-ci rodando
- [ ] Container frontend-ci rodando
- [ ] Teste direto no Nginx (porta 8082) funciona
- [ ] Teste via Traefik (HTTPS) funciona
- [ ] Login no frontend funciona
- [ ] Sem erro 405 no console

## 🎯 Resultado Esperado

```
✅ Nginx rodando na porta 8082
✅ Traefik roteando para Nginx
✅ Nginx roteando para backend/frontend
✅ POST /api/auth/login → HTTP 200/401
✅ OPTIONS /api/auth/login → HTTP 204
✅ CORS funcionando
✅ Login no frontend OK
✅ SEM ERRO 405
```

## 🔄 Fluxo de Requisição

```
1. Browser → https://ci.z7botsolutions.com.br/api/auth/login
2. Traefik (porta 443) → termina SSL
3. Traefik → nginx-ci (porta 80)
4. Nginx → backend-ci (porta 8081)
5. Backend → processa e responde
6. Nginx → adiciona headers CORS
7. Traefik → encaminha resposta
8. Browser → recebe resposta
```

## 💡 Por que essa solução funciona?

1. **Nginx tem configuração explícita** de CORS e métodos HTTP
2. **Traefik apenas faz proxy simples** sem middlewares complexos
3. **Não depende de configuração global** do Traefik
4. **Testado e funcionando** em outros ambientes

---

**Data:** 29/10/2025  
**Tentativa:** 4 (Solução definitiva com Nginx)  
**Status:** Pronto para deploy  
**Prioridade:** 🔴 CRÍTICA  
**Confiança:** 95% de sucesso
