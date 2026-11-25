#!/usr/bin/env bash
# =====================================================================
# Copia integral do banco da CI para o banco de PRODUCAO (mesma VPS).
#
# ATENCAO: DESTRUTIVO. Os dados atuais de PROD sao substituidos.
# Antes de rodar, e feito um backup completo do banco de PROD em
# /var/www/fluxbus/prod/backups/. Se a restauracao falhar, o backup
# e restaurado automaticamente.
#
# Uso (na VPS):
#   chmod +x /var/www/fluxbus/prod/migrate-ci-db-to-prod.sh
#   /var/www/fluxbus/prod/migrate-ci-db-to-prod.sh MIGRAR-CI-PARA-PROD
# =====================================================================
set -euo pipefail

CI_DB_CONTAINER="fluxbus-db-ci"
PROD_DB_CONTAINER="fluxbus-db-prod"
PROD_BACKEND_SERVICE="backend-prod"
PROD_COMPOSE_DIR="/var/www/fluxbus/prod"
BACKUP_DIR="${PROD_COMPOSE_DIR}/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
PROD_BACKUP="${BACKUP_DIR}/prod_before_ci_migration_${STAMP}.dump"
CI_DUMP="${BACKUP_DIR}/ci_dump_${STAMP}.dump"

if [[ "${1:-}" != "MIGRAR-CI-PARA-PROD" ]]; then
  echo "Confirmacao obrigatoria."
  echo "Uso: $0 MIGRAR-CI-PARA-PROD"
  exit 1
fi

echo "=== Migracao CI -> PROD (${STAMP}) ==="

for container in "$CI_DB_CONTAINER" "$PROD_DB_CONTAINER"; do
  if ! docker inspect "$container" >/dev/null 2>&1; then
    echo "ERRO: container '$container' nao encontrado nesta VPS."
    exit 1
  fi
done

if [[ ! -d "$PROD_COMPOSE_DIR" ]]; then
  echo "ERRO: diretorio $PROD_COMPOSE_DIR nao existe."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cd "$PROD_COMPOSE_DIR"

# ---------------------------------------------------------------------
echo "[1/7] Fazendo backup do banco de PRODUCAO..."
docker exec "$PROD_DB_CONTAINER" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/prod_before_migration.dump'
docker cp "${PROD_DB_CONTAINER}:/tmp/prod_before_migration.dump" "$PROD_BACKUP"
docker exec "$PROD_DB_CONTAINER" rm -f /tmp/prod_before_migration.dump
echo "Backup: $PROD_BACKUP"

# ---------------------------------------------------------------------
echo "[2/7] Gerando dump da CI (sem owner/privilegios)..."
docker exec "$CI_DB_CONTAINER" sh -c \
  'pg_dump -U "$POSTGRES_USER_CI" -d "$POSTGRES_DB_CI" -Fc --no-owner --no-privileges -f /tmp/ci_migration.dump'
docker cp "${CI_DB_CONTAINER}:/tmp/ci_migration.dump" "$CI_DUMP"
docker exec "$CI_DB_CONTAINER" rm -f /tmp/ci_migration.dump
echo "Dump CI: $CI_DUMP"

# ---------------------------------------------------------------------
echo "[3/7] Parando backend de PRODUCAO..."
docker compose stop "$PROD_BACKEND_SERVICE"

restore_prod_backup() {
  echo "REVERTENDO: restaurando backup de producao..."
  docker exec "$PROD_DB_CONTAINER" sh -c \
    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"' || true
  docker exec -i "$PROD_DB_CONTAINER" sh -c \
    'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges --exit-on-error' \
    < "$PROD_BACKUP" || echo "ERRO CRITICO: rollback falhou. Restaure manualmente: $PROD_BACKUP"
}

echo "[4/7] Limpando schema public da PRODUCAO..."
if ! docker exec "$PROD_DB_CONTAINER" sh -c \
  'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'; then
  restore_prod_backup
  docker compose start "$PROD_BACKEND_SERVICE"
  exit 1
fi

echo "[5/7] Restaurando dump da CI na PRODUCAO..."
if ! docker exec -i "$PROD_DB_CONTAINER" sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges --exit-on-error' \
  < "$CI_DUMP"; then
  restore_prod_backup
  docker compose start "$PROD_BACKEND_SERVICE"
  exit 1
fi

echo "[6/7] Subindo backend de PRODUCAO e limpando cache Redis..."
docker compose start "$PROD_BACKEND_SERVICE"
docker exec fluxbus-redis-prod sh -c \
  'if [ -n "${REDIS_PASSWORD_PROD:-}" ]; then redis-cli -a "$REDIS_PASSWORD_PROD" FLUSHALL >/dev/null 2>&1; else redis-cli FLUSHALL >/dev/null 2>&1; fi' \
  || echo "Aviso: nao foi possivel limpar o Redis (nao bloqueante)."

echo "[7/7] Aguardando backend e verificando saude..."
sleep 25
docker ps --filter "name=${PROD_BACKEND_SERVICE}" --format '{{.Names}} {{.Status}}' || true
if curl -fsS --max-time 10 https://fluxbus.com.br/api/health >/dev/null 2>&1; then
  echo "Health check PROD: OK"
else
  echo "AVISO: health check nao respondeu. Verifique: docker logs fluxbus-backend-prod --tail 100"
fi

echo "=== Migracao concluida ==="
echo "Backup de PROD antes da substituicao: $PROD_BACKUP"
echo "Dump da CI aplicado: $CI_DUMP"
