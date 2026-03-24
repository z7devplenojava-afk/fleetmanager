#!/bin/bash

# ========================================
# SCRIPT PARA CORRIGIR PERMISSÕES DO DOCKER
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

log "Corrigindo permissões do Docker..."

# ========================================
# 1. VERIFICAR SE DOCKER ESTÁ INSTALADO
# ========================================
log "1. Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log "Instalando Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
else
    log "✅ Docker já está instalado!"
fi

# ========================================
# 2. INICIAR DOCKER
# ========================================
log "2. Iniciando Docker..."
sudo systemctl start docker
sudo systemctl enable docker

log "✅ Docker iniciado!"

# ========================================
# 3. ADICIONAR USUÁRIO AO GRUPO DOCKER
# ========================================
log "3. Adicionando usuário ao grupo docker..."
sudo usermod -aG docker $USER

log "✅ Usuário adicionado ao grupo docker!"

# ========================================
# 4. VERIFICAR PERMISSÕES
# ========================================
log "4. Verificando permissões..."

# Verificar se usuário está no grupo docker
if groups $USER | grep -q docker; then
    log "✅ Usuário está no grupo docker!"
else
    warning "⚠️  Usuário não está no grupo docker ainda"
fi

# ========================================
# 5. TESTAR DOCKER
# ========================================
log "5. Testando Docker..."

# Testar com sudo primeiro
if sudo docker --version > /dev/null 2>&1; then
    log "✅ Docker funciona com sudo!"
else
    error "❌ Docker não funciona nem com sudo"
fi

# ========================================
# FINALIZAÇÃO
# ========================================
log "Permissões do Docker corrigidas!"
echo ""
warning "IMPORTANTE: Faça logout e login novamente para aplicar as permissões!"
echo ""
info "Após fazer logout/login, teste com:"
echo "docker --version"
echo "docker-compose --version"
echo ""
info "Depois execute:"
echo "docker-compose -f deploy/docker-compose.ci.yml up -d"
