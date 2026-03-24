#!/bin/bash

# Script para diagnosticar erro 500 no login
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

log "🔍 Diagnosticando erro 500 no login..."

# Verificar tamanho da chave JWT
log "0. Verificando configuração JWT..."
JWT_SECRET=$(grep JWT_SECRET deploy/env.ci | cut -d= -f2)
SECRET_LEN=${#JWT_SECRET}
if [ "$SECRET_LEN" -lt 64 ]; then
    error "CRÍTICO: JWT_SECRET tem apenas $SECRET_LEN caracteres. HS512 requer no mínimo 64 caracteres (512 bits)."
    warn "Isso causará erro 500 no login (java.lang.IllegalArgumentException: The specified key byte array is 53 bits which is not secure enough for any JWT HMAC-SHA algorithm)."
else
    log "✅ JWT_SECRET tem $SECRET_LEN caracteres (mínimo 64 ok)"
fi

# Verificar se o container está rodando
if ! docker ps | grep -q "secured-guard-backend-ci"; then
    error "Container backend-ci não está rodando!"
    exit 1
fi

log "1. Verificando logs do backend (últimas 100 linhas)..."
echo "=========================================="
docker compose -f deploy/docker-compose.ci.yml logs --tail=100 backend | grep -i -E "(error|exception|failed|login|authentication)" || true
echo "=========================================="

log "2. Verificando saúde do backend..."
curl -s http://localhost:8081/actuator/health || warn "Backend não está respondendo"

log "3. Verificando conexão com banco de dados..."
docker compose -f deploy/docker-compose.ci.yml exec -T backend sh -c "psql -h postgres -U postgres -d secured_guard_test -c 'SELECT 1;'" 2>&1 || warn "Não foi possível conectar ao banco"

log "4. Verificando se a tabela unified_documents tem as colunas corretas..."
docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -c "\d unified_documents" 2>&1 || warn "Tabela unified_documents não existe ou erro ao verificar"

log "5. Verificando migrations executadas..."
docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;" 2>&1 || warn "Não foi possível verificar migrations"

log "6. Verificando se há usuários no banco..."
docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -c "SELECT username, email FROM users LIMIT 5;" 2>&1 || warn "Não foi possível verificar usuários"

log "7. Verificando logs de erro recentes..."
echo "=========================================="
docker compose -f deploy/docker-compose.ci.yml logs --tail=200 backend 2>&1 | grep -i -A 5 -B 5 "500\|exception\|error" | tail -50 || true
echo "=========================================="

log "8. Testando endpoint de login diretamente..."
echo "Tentando fazer login de teste..."
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v 2>&1 | head -30 || true

log "✅ Diagnóstico concluído!"
log "📋 Revise os logs acima para identificar o problema"

