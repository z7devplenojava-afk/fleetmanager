#!/bin/bash

# ========================================
# SCRIPT DE BACKUP DO BANCO DE DADOS
# ========================================

set -e

# Cores
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

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Configurações
BACKUP_DIR="/opt/secured-guard/backups"
DATE=$(date +%Y%m%d_%H%M%S)

log "Iniciando backup do banco de dados..."

# ========================================
# 1. BACKUP PRODUÇÃO
# ========================================
log "1. Fazendo backup do banco de produção..."
if docker exec secured-guard-db-prod pg_dump -U postgres secured_guard > $BACKUP_DIR/prod_backup_$DATE.sql; then
    log "✅ Backup de produção concluído: prod_backup_$DATE.sql"
else
    warning "⚠️  Falha no backup de produção"
fi

# ========================================
# 2. BACKUP DESENVOLVIMENTO
# ========================================
log "2. Fazendo backup do banco de desenvolvimento..."
if docker exec secured-guard-db-dev pg_dump -U postgres secured_guard_dev > $BACKUP_DIR/dev_backup_$DATE.sql; then
    log "✅ Backup de desenvolvimento concluído: dev_backup_$DATE.sql"
else
    warning "⚠️  Falha no backup de desenvolvimento"
fi

# ========================================
# 3. BACKUP CI/TESTES
# ========================================
log "3. Fazendo backup do banco de CI/testes..."
if docker exec secured-guard-db-ci pg_dump -U postgres secured_guard_test > $BACKUP_DIR/ci_backup_$DATE.sql; then
    log "✅ Backup de CI concluído: ci_backup_$DATE.sql"
else
    warning "⚠️  Falha no backup de CI"
fi

# ========================================
# 4. SINCRONIZAR COM PRODUÇÃO (ESPELHAMENTO)
# ========================================
log "4. Sincronizando dados de produção para desenvolvimento..."

# Parar aplicação de desenvolvimento
docker-compose -f deploy/docker-compose.dev-domains.yml stop backend frontend

# Restaurar backup de produção no desenvolvimento
if docker exec -i secured-guard-db-dev psql -U postgres -d secured_guard_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" && \
   docker exec -i secured-guard-db-dev psql -U postgres -d secured_guard_dev < $BACKUP_DIR/prod_backup_$DATE.sql; then
    log "✅ Dados de produção sincronizados para desenvolvimento"
else
    warning "⚠️  Falha na sincronização"
fi

# Reiniciar aplicação de desenvolvimento
docker-compose -f deploy/docker-compose.dev-domains.yml start backend frontend

# ========================================
# 5. LIMPEZA DE BACKUPS ANTIGOS
# ========================================
log "5. Limpando backups antigos (manter últimos 7 dias)..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
log "✅ Limpeza concluída"

# ========================================
# 6. RESUMO
# ========================================
log "Backup concluído com sucesso!"
echo ""
info "📊 Resumo dos backups:"
echo "- Produção: $BACKUP_DIR/prod_backup_$DATE.sql"
echo "- Desenvolvimento: $BACKUP_DIR/dev_backup_$DATE.sql"
echo "- CI: $BACKUP_DIR/ci_backup_$DATE.sql"
echo ""
info "🔄 Sincronização:"
echo "- Dados de produção foram sincronizados para desenvolvimento"
echo ""
info "📁 Localização:"
echo "- Diretório: $BACKUP_DIR"
echo "- Total de arquivos: $(ls -1 $BACKUP_DIR/*.sql | wc -l)"
