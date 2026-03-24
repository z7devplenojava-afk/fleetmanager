#!/bin/bash

# Script para fazer deploy na VPS - Ambiente CI
# Execute este script na VPS ou via SSH

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

log "🚀 Iniciando deploy na VPS - Ambiente CI..."

# Verificar se estamos no diretório correto
if [ ! -f "deploy/docker-compose.ci.yml" ]; then
    error "Execute este script a partir do diretório raiz do projeto SecuredGuard"
fi

# ========================================
# 1. ATUALIZAR CÓDIGO DO REPOSITÓRIO
# ========================================
log "1. Atualizando código do repositório..."
git pull origin ci || warn "Não foi possível fazer pull. Continuando..."
log "✅ Código atualizado!"

# ========================================
# 2. PARAR SERVIÇOS ATUAIS
# ========================================
log "2. Parando serviços CI atuais..."
docker compose -f deploy/docker-compose.ci.yml down || warn "Alguns serviços podem não estar rodando"
log "✅ Serviços parados!"

# ========================================
# 3. BUILD E SUBIR SERVIÇOS
# ========================================
log "3. Fazendo build e subindo serviços CI..."
docker compose -f deploy/docker-compose.ci.yml up -d --build

# ========================================
# 4. AGUARDAR SERVIÇOS FICAREM PRONTOS
# ========================================
log "4. Aguardando serviços ficarem prontos..."
sleep 30

# ========================================
# 5. VERIFICAR STATUS
# ========================================
log "5. Verificando status dos serviços..."
docker compose -f deploy/docker-compose.ci.yml ps

# ========================================
# 6. VERIFICAR LOGS DO BACKEND
# ========================================
log "6. Verificando logs do backend (últimas 50 linhas)..."
docker compose -f deploy/docker-compose.ci.yml logs --tail=50 backend

log "🎉 Deploy concluído com sucesso!"
log "🌐 Acesse: https://ci.z7botsolutions.com.br"

