#!/bin/bash

# Script para corrigir erro 500 no login
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
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🔧 Corrigindo erro 500 no login..."

# 1. Verificar e corrigir colunas unified_documents
log "1. Verificando colunas da tabela unified_documents..."
HAS_OLD_COLUMNS=$(docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'unified_documents' AND column_name IN ('unified_file_name', 'unified_file_path');" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$HAS_OLD_COLUMNS" != "0" ] && [ "$HAS_OLD_COLUMNS" != "" ]; then
    log "Corrigindo nomes das colunas..."
    docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test <<EOF
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unified_documents' AND column_name = 'unified_file_name') THEN
        ALTER TABLE unified_documents RENAME COLUMN unified_file_name TO file_name;
        RAISE NOTICE 'Coluna unified_file_name renomeada para file_name';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unified_documents' AND column_name = 'unified_file_path') THEN
        ALTER TABLE unified_documents RENAME COLUMN unified_file_path TO file_path;
        RAISE NOTICE 'Coluna unified_file_path renomeada para file_path';
    END IF;
END \$\$;
EOF
    log "✅ Colunas corrigidas!"
else
    log "✅ Colunas já estão corretas"
fi

# 2. Verificar se a migration V336 foi executada
log "2. Verificando migrations..."
HAS_V336=$(docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -t -c "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '336';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$HAS_V336" = "0" ] || [ -z "$HAS_V336" ]; then
    warn "Migration V336 não encontrada. Executando manualmente..."
    docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test <<EOF
-- V336__fix_unified_documents_column_names.sql
ALTER TABLE unified_documents RENAME COLUMN unified_file_name TO file_name;
ALTER TABLE unified_documents RENAME COLUMN unified_file_path TO file_path;
COMMENT ON COLUMN unified_documents.file_name IS 'Nome do arquivo unificado';
COMMENT ON COLUMN unified_documents.file_path IS 'Caminho completo do arquivo unificado';
EOF
    log "✅ Migration V336 executada manualmente!"
fi

# 3. Verificar se a migration V335 foi executada (PayslipTableRow)
log "3. Verificando migration V335 (table_details)..."
HAS_V335=$(docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test -t -c "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '335';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$HAS_V335" = "0" ] || [ -z "$HAS_V335" ]; then
    warn "Migration V335 não encontrada. Executando manualmente..."
    docker compose -f deploy/docker-compose.ci.yml exec -T postgres psql -U postgres -d secured_guard_test <<EOF
-- V335__add_table_details_to_payslips.sql
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS table_details JSONB;
COMMENT ON COLUMN payslips.table_details IS 'Dados detalhados da tabela de vencimentos e descontos do holerite (JSONB)';
EOF
    log "✅ Migration V335 executada manualmente!"
fi

# 4. Reiniciar backend para aplicar mudanças
log "4. Reiniciando backend..."
docker compose -f deploy/docker-compose.ci.yml restart backend

# 5. Aguardar backend ficar pronto
log "5. Aguardando backend ficar pronto..."
sleep 15

# 6. Verificar saúde
log "6. Verificando saúde do backend..."
for i in {1..10}; do
    if curl -s -f http://localhost:8081/actuator/health > /dev/null 2>&1; then
        log "✅ Backend está respondendo!"
        break
    else
        warn "Aguardando backend... ($i/10)"
        sleep 3
    fi
done

# 7. Verificar logs de erro
log "7. Verificando logs recentes do backend..."
docker compose -f deploy/docker-compose.ci.yml logs --tail=50 backend | grep -i -E "(error|exception|started)" | tail -20 || true

log "🎉 Correção concluída!"
log "📋 Teste o login novamente. Se ainda houver erro, execute: ./deploy/diagnose-login-error.sh"

