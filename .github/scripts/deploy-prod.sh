#!/bin/bash
set -e
mkdir -p /var/www/fluxbus/prod
rm -rf /var/www/secured_guard 2>/dev/null || true
cd /var/www/fluxbus/prod
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
docker tag z7design/fluxbus-backend:prod z7design/fluxbus-backend:backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
docker image prune -af 2>/dev/null || true
docker builder prune -af 2>/dev/null || true
docker compose pull
docker compose down --remove-orphans || true
docker compose up -d --force-recreate --remove-orphans || {
  echo "❌ Falha ao subir containers no PROD. Logs do backend:"
  docker logs fluxbus-backend-prod --tail 100 || true
  echo "Logs da Evolution API:"
  docker logs fluxbus-evolution-api-prod --tail 50 || true
  exit 1
}
docker compose ps
docker restart traefik 2>/dev/null || true
