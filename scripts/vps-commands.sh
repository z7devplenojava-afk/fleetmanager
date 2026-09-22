#!/bin/bash

# Helper to start environments on VPS via SSH

set -e

if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_PORT" ]; then
  echo "Usage: VPS_HOST=ip VPS_USER=user VPS_PORT=22 ./scripts/vps-commands.sh [ci|dev|prod]"
  exit 1
fi

ENV_FILE=""
case "$1" in
  ci) ENV_FILE="deploy/docker-compose.ci-domains.yml" ;;
  dev) ENV_FILE="deploy/docker-compose.dev-domains.yml" ;;
  prod) ENV_FILE="deploy/docker-compose.prod-domains.yml" ;;
  *) echo "Specify environment: ci|dev|prod"; exit 1 ;;
esac

ssh -p "$VPS_PORT" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" \
  "set -e; \
   cd /opt/fluxbus; \
   docker network ls --format '{{.Name}}' | grep -q '^fluxbus$' || docker network create --driver bridge fluxbus; \
   docker compose -f $ENV_FILE down || true; \
   docker compose -f $ENV_FILE up -d --build; \
   docker compose -f $ENV_FILE ps"

echo "Started $1 environment on VPS"

#!/bin/bash

# ===================== COMANDOS PARA EXECUTAR NA VPS =====================
# Execute estes comandos um por vez na VPS

echo "🔍 Verificando status da VPS FluxBus..."
echo ""

echo "1️⃣ Verificando containers Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "2️⃣ Verificando logs do backend (últimas 10 linhas):"
docker logs --tail 10 fluxbus-backend-1 2>/dev/null || echo "   ❌ Backend não encontrado"
echo ""

echo "3️⃣ Verificando logs do PostgreSQL (últimas 5 linhas):"
docker logs --tail 5 fluxbus-postgres-1 2>/dev/null || echo "   ❌ PostgreSQL não encontrado"
echo ""

echo "4️⃣ Verificando bancos de dados:"
docker exec fluxbus-postgres-1 psql -U postgressg -d postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'fluxbus%';" 2>/dev/null || echo "   ❌ Não foi possível conectar no PostgreSQL"
echo ""

echo "5️⃣ Testando endpoint do backend:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/actuator/health 2>/dev/null || echo "   ❌ Backend não está respondendo"
echo ""

echo "6️⃣ Verificando uso de recursos:"
echo "   CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "   Memória: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "   Disco: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " usado)"}')"
echo ""

echo "✅ Verificação concluída!"
