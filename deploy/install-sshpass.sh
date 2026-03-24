#!/bin/bash

# ========================================
# SCRIPT PARA INSTALAR SSHPASS
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

log "Instalando sshpass..."

# Instalar sshpass
sudo apt update
sudo apt install -y sshpass

log "✅ sshpass instalado com sucesso!"

# Testar
log "Testando sshpass..."
if sshpass -V > /dev/null 2>&1; then
    log "✅ sshpass funcionando!"
else
    error "❌ sshpass não está funcionando"
fi
