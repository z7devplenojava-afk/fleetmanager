#!/bin/bash

# ========================================
# SCRIPT PARA CORRIGIR CONEXÃO SSH
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

# Configurações
VPS_HOST="185.225.233.18"
VPS_USER="root"
VPS_PORT="22"

log "Corrigindo conexão SSH com a VPS..."

# ========================================
# 1. CRIAR DIRETÓRIO SSH SE NÃO EXISTIR
# ========================================
log "1. Criando diretório SSH..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# ========================================
# 2. ADICIONAR CHAVE DO HOST
# ========================================
log "2. Adicionando chave do host..."

# Criar diretório SSH se não existir
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts

ssh-keyscan -p $VPS_PORT $VPS_HOST >> ~/.ssh/known_hosts

# ========================================
# 3. GERAR CHAVE SSH SE NÃO EXISTIR
# ========================================
log "3. Verificando chave SSH..."
if [ ! -f ~/.ssh/id_rsa ]; then
    log "Gerando chave SSH..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "fluxbus-deploy"
    log "✅ Chave SSH gerada!"
else
    log "✅ Chave SSH já existe!"
fi

# ========================================
# 4. COPIAR CHAVE PARA VPS
# ========================================
log "4. Copiando chave para VPS..."
log "Você será solicitado a digitar a senha do root da VPS..."

# Tentar copiar a chave
if ssh-copy-id -p $VPS_PORT $VPS_USER@$VPS_HOST; then
    log "✅ Chave SSH copiada com sucesso!"
else
    warning "⚠️  Não foi possível copiar a chave automaticamente."
    info "Execute manualmente:"
    echo "ssh-copy-id -p $VPS_PORT $VPS_USER@$VPS_HOST"
    echo ""
    info "Ou copie a chave manualmente:"
    echo "cat ~/.ssh/id_rsa.pub"
    echo "E cole no arquivo ~/.ssh/authorized_keys da VPS"
fi

# ========================================
# 5. TESTAR CONEXÃO
# ========================================
log "5. Testando conexão SSH..."
if ssh -p $VPS_PORT -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST "echo 'SSH OK'" 2>/dev/null; then
    log "✅ SSH funcionando perfeitamente!"
    log "Agora você pode executar o deploy:"
    echo "./deploy/deploy-to-vps-wsl.sh"
else
    error "❌ SSH ainda não está funcionando"
    info "Tente conectar manualmente:"
    echo "ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
fi
