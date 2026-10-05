#!/bin/bash

# Script para diagnosticar erro 502 Bad Gateway no ambiente CI
# Execute este script na VPS

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🔍 Diagnosticando erro 502 Bad Gateway..."

# Verificar se o docker-compose está no diretório correto
if [ ! -f "docker-compose.ci.yml" ]; then
    error "docker-compose.ci.yml não encontrado no diretório atual"
    exit 1
fi

# 1. Verificar se os containers estão rodando
log "1. Verificando status dos containers..."
docker compose -f docker-compose.ci.yml ps

# 2. Verificar se o backend está rodando
log "2. Verificando se o backend está rodando..."
if ! docker ps | grep -q "fluxbus-backend-ci"; then
    error "❌ Container backend-ci NÃO está rodando!"
    log "Tentando iniciar o container..."
    docker compose -f docker-compose.ci.yml up -d backend-ci
    sleep 10
else
    log "✅ Container backend-ci está rodando"
fi

# 3. Verificar logs do backend (últimas 50 linhas)
log "3. Verificando logs do backend (últimas 50 linhas)..."
echo "=========================================="
docker compose -f docker-compose.ci.yml logs --tail=50 backend-ci
echo "=========================================="

# 4. Verificar se o backend está respondendo na porta 8081
log "4. Testando conexão com backend na porta 8081..."
if curl -f -s -m 5 http://localhost:8081/api/health > /dev/null 2>&1; then
    log "✅ Backend está respondendo em localhost:8081"
    curl -s http://localhost:8081/api/health | jq . || curl -s http://localhost:8081/api/health
else
    error "❌ Backend NÃO está respondendo em localhost:8081"
    log "Verificando se a porta está em uso..."
    netstat -tuln | grep 8081 || ss -tuln | grep 8081 || true
fi

# 5. Verificar se o backend está acessível dentro da rede Docker
log "5. Testando conexão do nginx para o backend..."
if docker exec fluxbus-nginx-ci curl -f -s -m 5 http://fluxbus-backend-ci:8081/api/health > /dev/null 2>&1; then
    log "✅ Backend está acessível do nginx"
else
    error "❌ Backend NÃO está acessível do nginx"
    log "Verificando rede Docker..."
    docker network inspect fluxbus-ci-network | grep -A 5 "backend-ci" || true
fi

# 6. Verificar conexão com banco de dados
log "6. Verificando conexão do backend com banco de dados..."
docker compose -f docker-compose.ci.yml exec -T backend-ci sh -c "nc -zv postgres-ci 5432" 2>&1 || warn "Não foi possível conectar ao PostgreSQL"

# 7. Verificar variáveis de ambiente do backend
log "7. Verificando variáveis de ambiente críticas do backend..."
docker compose -f docker-compose.ci.yml exec -T backend-ci sh -c "echo 'JWT_SECRET length:' && echo \$JWT_SECRET | wc -c" 2>&1 || true
docker compose -f docker-compose.ci.yml exec -T backend-ci sh -c "echo 'SPRING_DATASOURCE_URL:' && echo \$SPRING_DATASOURCE_URL" 2>&1 || true

# 8. Verificar logs de erro específicos
log "8. Buscando erros críticos nos logs..."
echo "=========================================="
docker compose -f docker-compose.ci.yml logs --tail=200 backend-ci 2>&1 | grep -i -E "(error|exception|failed|started|application|502|bad gateway)" | tail -30 || true
echo "=========================================="

# 9. Verificar healthcheck do container
log "9. Verificando status do healthcheck..."
docker inspect fluxbus-backend-ci --format='{{json .State.Health}}' | jq . || docker inspect fluxbus-backend-ci --format='{{.State.Health.Status}}' || true

# 10. Verificar nginx
log "10. Verificando nginx..."
if docker ps | grep -q "fluxbus-nginx-ci"; then
    log "✅ Nginx está rodando"
    docker compose -f docker-compose.ci.yml logs --tail=20 nginx-ci | grep -i -E "(error|502|bad gateway)" || log "Nenhum erro recente no nginx"
else
    error "❌ Nginx NÃO está rodando"
fi

# 11. Testar endpoint de health através do nginx
log "11. Testando /api/health através do nginx..."
curl -s -m 5 http://localhost:8082/api/health || error "Nginx não está respondendo"

# 12. Verificar se o backend está iniciando corretamente
log "12. Verificando processo Java no backend..."
docker compose -f docker-compose.ci.yml exec -T backend-ci sh -c "ps aux | grep java" || warn "Processo Java não encontrado"

log "✅ Diagnóstico concluído!"
log "📋 Revise os logs acima para identificar o problema"
log "💡 Se o backend não está iniciando, verifique os logs completos com:"
log "   docker compose -f docker-compose.ci.yml logs --tail=500 backend-ci"

