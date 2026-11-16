#!/bin/bash
set -e
# Parar e remover qualquer container legado do secured_guard
docker stop secured-guard-db-ci secured-guard-redis-ci secured-guard-backend-ci secured-guard-frontend-ci secured-guard-whatsapp-ci secured-guard-nginx-ci secured-guard-evolution-ci 2>/dev/null || true
docker rm secured-guard-db-ci secured-guard-redis-ci secured-guard-backend-ci secured-guard-frontend-ci secured-guard-whatsapp-ci secured-guard-nginx-ci secured-guard-evolution-ci 2>/dev/null || true
rm -rf /var/www/secured_guard 2>/dev/null || true

# Remover containers orfaos de nomes fixos (conflito de container_name)
docker rm -f fluxbus-nginx-ci fluxbus-db-ci fluxbus-redis-ci fluxbus-backend-ci fluxbus-frontend-ci fluxbus-whatsapp-ci whatsapp-service-ci fluxbus-astracalls-ci fluxbus-astracalls-db-ci 2>/dev/null || true

# Derrubar stack legado antigo (compose renomeado em /var/www/fluxbus)
if [ -f /var/www/fluxbus/docker-compose.yml ]; then
  (cd /var/www/fluxbus && docker compose down --remove-orphans) 2>/dev/null || true
fi

cd /var/www/fluxbus/ci
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
docker network create z7network 2>/dev/null || true
docker compose -f docker-compose.ci.yml down --remove-orphans 2>/dev/null || true
# Limpar imagens antigas e camadas em cache para evitar 'no space left on device'
docker system prune -af --filter "until=6h" 2>/dev/null || true
docker image prune -af 2>/dev/null || true
docker builder prune -af 2>/dev/null || true
for i in 1 2 3; do
  docker pull z7design/fluxbus-backend:ci && \
  docker pull z7design/fluxbus-frontend:ci && \
  docker pull z7design/fluxbus-whatsapp:ci && \
  docker pull z7design/fluxbus-astracalls:ci && break || sleep 15
done

# Iniciar banco antes do backend para remover registros de migracao
# com falha (PostgreSQL faz rollback, mas o Flyway mantem a linha).
docker compose -f docker-compose.ci.yml up -d postgres-ci
docker exec fluxbus-db-ci sh -c 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do sleep 1; done'
docker exec fluxbus-db-ci sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT pg_advisory_unlock_all(); DELETE FROM flyway_schema_history WHERE success = false;"' || true

docker compose -f docker-compose.ci.yml up -d --force-recreate --remove-orphans || {
  echo "❌ Falha ao subir containers no CI. Logs do backend:"
  docker logs fluxbus-backend-ci --tail 100 || true
  echo "Logs do frontend:"
  docker logs fluxbus-frontend-ci --tail 50 || true
  exit 1
}
docker compose -f docker-compose.ci.yml ps
