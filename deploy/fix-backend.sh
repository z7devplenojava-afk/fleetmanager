#!/bin/bash

# ========================================
# CORREÇÃO BACKEND VPS
# Script para corrigir problemas do backend na VPS
# ========================================

set -e

echo "🔧 CORREÇÃO BACKEND VPS - SecuredGuard"
echo "======================================"

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

# Ir para diretório do projeto
cd /opt/secured-guard

log "1. Parando todos os containers..."
docker compose -f deploy/docker-compose.prod.yml down 2>/dev/null || true
docker compose -f deploy/docker-compose.dev.yml down 2>/dev/null || true
docker compose -f deploy/docker-compose.ci.yml down 2>/dev/null || true

log "2. Limpando containers órfãos..."
docker system prune -f

log "3. Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    warning "Arquivo .env não encontrado. Criando..."
    cat > .env << EOF
POSTGRES_DB=secured_guard_prod
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx
POSTGRES_DB_DEV=secured_guard_dev
POSTGRES_USER_DEV=postgressg
POSTGRES_PASSWORD_DEV=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx
POSTGRES_DB_CI=secured_guard_ci
POSTGRES_USER_CI=postgressg
POSTGRES_PASSWORD_CI=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx
REDIS_PASSWORD=redis_secured_guard_2024
JWT_SECRET=795927eaf0f77f4687edf8c7faaf30e2bd60d1c2215c0015ce9ddc83c8119615a3dec0755b6109a88d5077e6e4344a5b00be395e4c02a57ed923f95f1afebfed
EOF
    chmod 600 .env
fi

log "4. Subindo Postgres primeiro..."
docker compose -f deploy/docker-compose.prod.yml up -d postgres
sleep 10

log "5. Verificando se Postgres está healthy..."
docker compose -f deploy/docker-compose.prod.yml ps postgres

log "6. Criando banco se não existir..."
docker compose -f deploy/docker-compose.prod.yml exec postgres sh -c "
    psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname='secured_guard_prod'\" | grep -q 1 || \
    psql -U postgres -c \"CREATE DATABASE secured_guard_prod OWNER postgressg;\"
"

log "7. Reparando Flyway..."
docker run --rm \
    --network secured-guard-network \
    -v /opt/secured-guard/backend/src/main/resources/db/migration:/flyway/sql \
    flyway/flyway:9.22.3 \
    -url=jdbc:postgresql://postgres:5432/secured_guard_prod \
    -user=postgressg \
    -password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
    -schemas=public \
    repair

log "8. Migrando Flyway..."
docker run --rm \
    --network secured-guard-network \
    -v /opt/secured-guard/backend/src/main/resources/db/migration:/flyway/sql \
    flyway/flyway:9.22.3 \
    -url=jdbc:postgresql://postgres:5432/secured_guard_prod \
    -user=postgressg \
    -password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
    -schemas=public \
    -outOfOrder=true \
    migrate

log "9. Subindo Redis..."
docker compose -f deploy/docker-compose.prod.yml up -d redis
sleep 5

log "10. Subindo Backend..."
docker compose -f deploy/docker-compose.prod.yml up -d backend
sleep 15

log "11. Verificando logs do backend..."
docker compose -f deploy/docker-compose.prod.yml logs --tail=30 backend

log "12. Subindo Frontend..."
docker compose -f deploy/docker-compose.prod.yml up -d frontend
sleep 10

log "13. Subindo Nginx..."
docker compose -f deploy/docker-compose.prod.yml up -d nginx
sleep 5

log "14. Status final dos serviços..."
docker compose -f deploy/docker-compose.prod.yml ps

log "15. Testando health check..."
sleep 10
if curl -f http://localhost:8080/actuator/health 2>/dev/null; then
    echo "✅ Backend funcionando!"
else
    echo "❌ Backend ainda com problemas"
    echo "Logs do backend:"
    docker compose -f deploy/docker-compose.prod.yml logs --tail=50 backend
fi

log "16. Testando frontend..."
if curl -f http://localhost/ 2>/dev/null; then
    echo "✅ Frontend funcionando!"
else
    echo "❌ Frontend com problemas"
fi

echo ""
echo "======================================"
log "CORREÇÃO CONCLUÍDA"
echo "======================================"
echo ""
info "URLs:"
echo "  Frontend: http://localhost/"
echo "  Backend:  http://localhost:8080"
echo "  Health:   http://localhost:8080/actuator/health"
echo ""
info "Comandos úteis:"
echo "  docker compose -f deploy/docker-compose.prod.yml logs -f backend"
echo "  docker compose -f deploy/docker-compose.prod.yml ps"
echo "  docker compose -f deploy/docker-compose.prod.yml restart backend"
