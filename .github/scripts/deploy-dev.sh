#!/bin/bash
set -e
mkdir -p /var/www/fluxbus/dev
rm -rf /var/www/secured_guard 2>/dev/null || true
cd /var/www/fluxbus/dev
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
docker compose pull
docker compose down
# Iniciar PostgreSQL primeiro e limpar migracoes com falha no Flyway
docker compose up -d postgres-dev
docker exec fluxbus-db-dev sh -c 'until pg_isready -U "${POSTGRES_USER_DEV:-fluxbus_user_dev}" -d "${POSTGRES_DB_DEV:-fluxbus_db_dev}" >/dev/null 2>&1; do sleep 1; done'
docker exec fluxbus-db-dev sh -c 'psql -U "${POSTGRES_USER_DEV:-fluxbus_user_dev}" -d "${POSTGRES_DB_DEV:-fluxbus_db_dev}" -c "DELETE FROM flyway_schema_history WHERE success = false;"' || true
docker compose up -d --force-recreate --remove-orphans || {
  echo "❌ Falha ao subir containers no DEV. Logs do backend:"
  docker logs fluxbus-backend-dev --tail 100 || true
  exit 1
}
docker compose ps
