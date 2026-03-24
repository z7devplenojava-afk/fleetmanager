#!/bin/bash

# ========================================
# SCRIPT PARA TESTAR CONEXÃO SSH
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
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

echo "🔍 Testando conexão SSH com a VPS..."
echo ""

# Configurações
VPS_HOST="185.225.233.18"
VPS_USER="root"
VPS_PORT="22"

log "Testando conexão: $VPS_USER@$VPS_HOST:$VPS_PORT"

# ========================================
# 1. TESTAR PING
# ========================================
log "1. Testando conectividade de rede..."
if ping -c 3 $VPS_HOST > /dev/null 2>&1; then
    log "✅ Ping OK - VPS está acessível"
else
    error "❌ Ping falhou - VPS não está acessível"
    exit 1
fi

# ========================================
# 2. TESTAR PORTA SSH
# ========================================
log "2. Testando porta SSH..."
if nc -z -w5 $VPS_HOST $VPS_PORT 2>/dev/null; then
    log "✅ Porta $VPS_PORT está aberta"
else
    error "❌ Porta $VPS_PORT está fechada ou bloqueada"
    info "Verifique se o SSH está rodando na VPS"
    exit 1
fi

# ========================================
# 3. TESTAR SSH COM VERBOSE
# ========================================
log "3. Testando SSH com verbose..."
echo "Executando: ssh -v -p $VPS_PORT -o ConnectTimeout=10 $VPS_USER@$VPS_HOST"
echo ""

ssh -v -p $VPS_PORT -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH OK'" 2>&1

if [ $? -eq 0 ]; then
    log "✅ SSH funcionando perfeitamente!"
else
    error "❌ SSH falhou"
    echo ""
    info "Possíveis soluções:"
    echo "1. Verificar se a chave SSH está configurada:"
    echo "   ssh-keygen -t rsa -b 4096"
    echo "   ssh-copy-id -p $VPS_PORT $VPS_USER@$VPS_HOST"
    echo ""
    echo "2. Verificar se o SSH está rodando na VPS:"
    echo "   sudo systemctl status ssh"
    echo ""
    echo "3. Verificar configuração do SSH na VPS:"
    echo "   sudo nano /etc/ssh/sshd_config"
    echo ""
    echo "4. Verificar firewall na VPS:"
    echo "   sudo ufw status"
    echo "   sudo ufw allow ssh"
    echo ""
    echo "5. Tentar conectar com senha:"
    echo "   ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
fi
