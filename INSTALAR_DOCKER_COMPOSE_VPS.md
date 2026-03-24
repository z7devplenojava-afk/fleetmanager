# Instalar Docker Compose na VPS

## Problema
O `docker-compose` não está instalado ou não está no PATH.

## Solução: Instalar Docker Compose

Execute estes comandos na VPS:

```bash
# 1. Verificar se docker-compose existe em algum lugar
which docker-compose
find /usr -name docker-compose 2>/dev/null
find /usr/local -name docker-compose 2>/dev/null

# 2. Se não encontrar, instalar docker-compose
# Opção A: Instalar via pip (se Python estiver instalado)
pip install docker-compose

# Opção B: Baixar binário diretamente
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 3. Verificar instalação
docker-compose --version

# 4. Se ainda não funcionar, criar link simbólico
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 5. Testar
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml --version
```

## Alternativa: Subir Containers Manualmente

Se não conseguir instalar docker-compose, pode subir os containers manualmente:

```bash
cd /var/www/secured_guard/ci

# Criar rede se não existir
docker network create z7network 2>/dev/null || true
docker network create secured-guard-ci 2>/dev/null || true

# Subir PostgreSQL
docker run -d --name secured-guard-db-ci \
  --network z7network \
  --network secured-guard-ci \
  -e POSTGRES_DB=secured_guard_ci \
  -e POSTGRES_USER=secured_guard_ci \
  -e POSTGRES_PASSWORD=4KaCiJc6an@7sgbdcid2025 \
  -v postgres_data_ci:/var/lib/postgresql/data \
  postgres:15-alpine

# Subir Redis
docker run -d --name secured-guard-redis-ci \
  --network z7network \
  --network secured-guard-ci \
  -e REDIS_PASSWORD=redis_ci_2025 \
  -v redis_data_ci:/data \
  redis:7-alpine redis-server --appendonly yes --requirepass redis_ci_2025

# Subir Backend
docker run -d --name secured-guard-backend-ci \
  --network z7network \
  --network secured-guard-ci \
  --env-file .env \
  -e SPRING_PROFILES_ACTIVE=ci \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://secured-guard-db-ci:5432/secured_guard_ci \
  -p 8081:8080 \
  -v uploads_ci:/var/www/secured_guard/ci/uploads \
  -v logs_ci:/var/www/secured_guard/ci/logs \
  z7design/secured-guard-backend:ci

# Subir Frontend
docker run -d --name secured-guard-frontend-ci \
  --network z7network \
  --network secured-guard-ci \
  -p 3000:80 \
  z7design/secured-guard-frontend:ci

# Verificar
docker ps | grep secured-guard
```
