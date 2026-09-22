#!/bin/bash

# ========================================
# DIAGNÓSTICO BACKEND VPS
# Script para verificar status do backend na VPS
# ========================================

echo "🔍 DIAGNÓSTICO BACKEND VPS - FluxBus"
echo "=========================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo ""
log "1. Verificando containers Docker..."
docker ps -a | grep fluxbus || echo "Nenhum container fluxbus encontrado"

echo ""
log "2. Verificando status dos serviços..."
if [ -f "/opt/fluxbus/deploy/docker-compose.prod.yml" ]; then
    cd /opt/fluxbus
    docker compose -f deploy/docker-compose.prod.yml ps
else
    warning "Arquivo docker-compose.prod.yml não encontrado"
fi

echo ""
log "3. Verificando logs do backend..."
if docker ps -q -f name=fluxbus-backend-prod | grep -q .; then
    echo "=== ÚLTIMAS 50 LINHAS DO LOG DO BACKEND ==="
    docker logs --tail=50 fluxbus-backend-prod
else
    error "Container backend-prod não está rodando"
fi

echo ""
log "4. Verificando logs do Postgres..."
if docker ps -q -f name=fluxbus-db-prod | grep -q .; then
    echo "=== ÚLTIMAS 20 LINHAS DO LOG DO POSTGRES ==="
    docker logs --tail=20 fluxbus-db-prod
else
    error "Container db-prod não está rodando"
fi

echo ""
log "5. Verificando conectividade do banco..."
if docker ps -q -f name=fluxbus-db-prod | grep -q .; then
    docker exec fluxbus-db-prod pg_isready -U postgressg || error "Postgres não está respondendo"
else
    error "Postgres não está rodando"
fi

echo ""
log "6. Verificando arquivo .env..."
if [ -f "/opt/fluxbus/.env" ]; then
    echo "Arquivo .env existe"
    echo "Variáveis principais:"
    grep -E "POSTGRES_|REDIS_" /opt/fluxbus/.env | head -5
else
    error "Arquivo .env não encontrado"
fi

echo ""
log "7. Verificando portas em uso..."
netstat -tlnp | grep -E ":(8080|8081|5432|5433)" || echo "Portas não encontradas"

echo ""
log "8. Verificando espaço em disco..."
df -h /opt/fluxbus 2>/dev/null || df -h /

echo ""
log "9. Verificando memória..."
free -h

echo ""
log "10. Verificando GitHub Actions recentes..."
if command -v gh &> /dev/null; then
    gh run list --limit 5
else
    echo "GitHub CLI não instalado. Verifique manualmente em: https://github.com/zemarioramos/fluxbus/actions"
fi

echo ""
log "11. Tentando reiniciar backend..."
if [ -f "/opt/fluxbus/deploy/docker-compose.prod.yml" ]; then
    cd /opt/fluxbus
    echo "Parando backend..."
    docker compose -f deploy/docker-compose.prod.yml stop backend
    sleep 3
    echo "Iniciando backend..."
    docker compose -f deploy/docker-compose.prod.yml up -d backend
    sleep 10
    echo "Status após reinício:"
    docker compose -f deploy/docker-compose.prod.yml ps backend
else
    error "Não foi possível reiniciar - arquivo compose não encontrado"
fi

echo ""
log "12. Testando health check..."
sleep 5
curl -f http://localhost:8080/actuator/health 2>/dev/null && echo "✅ Backend respondendo" || echo "❌ Backend não responde"

echo ""
log "13. Verificando logs após reinício..."
if docker ps -q -f name=fluxbus-backend-prod | grep -q .; then
    echo "=== LOGS APÓS REINÍCIO ==="
    docker logs --tail=20 fluxbus-backend-prod
fi

echo ""
echo "=========================================="
log "DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="
