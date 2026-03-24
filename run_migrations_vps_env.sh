#!/bin/bash

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

# Verificar se o ambiente foi especificado
if [ -z "$1" ]; then
    error "Especifique o ambiente: prod, dev, ou ci"
    echo "Uso: $0 [prod|dev|ci]"
    exit 1
fi

ENVIRONMENT=$1
PROFILE="vps-$ENVIRONMENT"

log "🚀 Executando migrações do banco de dados na VPS - Ambiente: $ENVIRONMENT"

# ========================================
# 1. VERIFICAR CONFIGURAÇÃO
# ========================================
log "1. Verificando configuração do banco..."

# Verificar se estamos no diretório correto
if [ ! -f "backend/pom.xml" ]; then
    error "Arquivo pom.xml não encontrado. Execute este script no diretório raiz do projeto."
fi

# Verificar se o Maven está instalado
if ! command -v mvn &> /dev/null; then
    error "Maven não está instalado. Instale o Maven primeiro."
fi

log "✅ Configuração verificada!"

# ========================================
# 2. VERIFICAR STATUS DAS MIGRAÇÕES
# ========================================
log "2. Verificando status das migrações..."
cd backend

# Mostrar informações das migrações
log "📊 Status atual das migrações:"
mvn flyway:info -Dspring.profiles.active=$PROFILE

# ========================================
# 3. EXECUTAR MIGRAÇÕES
# ========================================
log "3. Executando migrações pendentes..."

# Executar migrações com perfil específico
mvn flyway:migrate -Dspring.profiles.active=$PROFILE

log "✅ Migrações executadas com sucesso!"

# ========================================
# 4. VERIFICAR RESULTADO
# ========================================
log "4. Verificando resultado das migrações..."
mvn flyway:info -Dspring.profiles.active=$PROFILE

# ========================================
# 5. VERIFICAR TABELAS CRIADAS
# ========================================
log "5. Verificando tabelas criadas..."

# Conectar ao banco e listar tabelas
log "📋 Listando tabelas do banco de dados:"

# Usar psql se disponível
if command -v psql &> /dev/null; then
    # Configurações do banco baseadas no ambiente
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="secured_guard_$ENVIRONMENT"
    DB_USER="postgressg"
    
    log "🔍 Conectando ao banco de dados: $DB_NAME"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt" || warn "Não foi possível conectar ao banco para listar tabelas"
else
    warn "psql não está disponível. Não é possível listar tabelas automaticamente."
fi

log "🎉 Migrações concluídas com sucesso!"
log "📝 Verifique o log acima para confirmar que todas as tabelas foram criadas."
log "🌍 Ambiente: $ENVIRONMENT | Banco: secured_guard_$ENVIRONMENT"
