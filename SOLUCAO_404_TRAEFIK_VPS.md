# 🔧 Solução Imediata para 404 no Traefik (VPS)

## 🔍 Problema Identificado

O Traefik não está detectando o container do Nginx mesmo com as labels aplicadas. Os routers `nginx-ci-https` e `nginx-ci-http` não aparecem na lista de routers do Traefik.

## ✅ Solução Imediata na VPS

Execute estes comandos na VPS:

```bash
cd /var/www/secured_guard/ci

# 1. Parar e remover container do Nginx
docker stop secured-guard-nginx-ci
docker rm secured-guard-nginx-ci

# 2. Recriar apenas o Nginx (sem force-recreate para evitar erro)
docker-compose -f docker-compose.ci.yml up -d nginx-ci

# 3. Aguardar Nginx iniciar
sleep 5

# 4. Verificar se Nginx está na rede z7network
docker network inspect z7network | grep -E "(traefik|nginx-ci)"

# 5. Reiniciar Traefik para detectar novo container
docker restart traefik
sleep 15

# 6. Verificar routers (deve mostrar nginx-ci-https e nginx-ci-http)
docker exec traefik wget -qO- http://localhost:8080/api/http/routers | jq -r '.[].name' | grep nginx

# 7. Testar acesso
curl -k -H "Host: ci.z7botsolutions.com.br" https://localhost/api/health
```

## 🔍 Se Ainda Não Funcionar

### Verificar se Traefik está detectando containers Docker:

```bash
# Verificar configuração do Traefik
docker inspect traefik | jq -r '.[0].Config.Cmd' | grep docker

# Deve mostrar: --providers.docker=true e --providers.docker.network=z7network
```

### Verificar logs do Traefik:

```bash
docker logs traefik --tail 50 | grep -i "nginx\|error\|docker"
```

### Forçar detecção manual:

```bash
# Recriar Nginx com labels explícitas
docker run -d \
  --name secured-guard-nginx-ci \
  --network z7network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.nginx-ci-https.rule=Host(\`ci.z7botsolutions.com.br\`)" \
  --label "traefik.http.routers.nginx-ci-https.entrypoints=websecure" \
  --label "traefik.http.routers.nginx-ci-https.tls.certresolver=letsencryptresolver" \
  --label "traefik.http.routers.nginx-ci-https.service=nginx-ci-service" \
  --label "traefik.http.routers.nginx-ci-https.priority=2000" \
  --label "traefik.http.services.nginx-ci-service.loadbalancer.server.port=80" \
  -v /var/www/secured_guard/ci/nginx/ci.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine

# Reiniciar Traefik
docker restart traefik
sleep 15
```

## 📋 Verificações Finais

```bash
# 1. Verificar routers
docker exec traefik wget -qO- http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("nginx"))'

# 2. Verificar serviços
docker exec traefik wget -qO- http://localhost:8080/api/http/services | jq '.[] | select(.name | contains("nginx"))'

# 3. Testar conectividade Traefik → Nginx
docker exec traefik wget -qO- --timeout=5 http://secured-guard-nginx-ci:80/health

# 4. Testar acesso externo
curl -k -H "Host: ci.z7botsolutions.com.br" https://localhost/api/health
```

## 💡 Causa Provável

O Traefik precisa ser reiniciado **após** o container do Nginx ser criado para detectar as labels. O `docker-compose up -d --force-recreate` está falhando com erro de `ContainerConfig`, então é melhor parar e remover manualmente antes de recriar.

