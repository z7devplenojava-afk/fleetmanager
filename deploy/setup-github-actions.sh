#!/bin/bash

# ========================================
# SCRIPT PARA CONFIGURAR GITHUB ACTIONS
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

log "Configurando GitHub Actions para CI/CD..."

# ========================================
# 1. GERAR CHAVE SSH
# ========================================
log "1. Gerando chave SSH para GitHub Actions..."

# Verificar se chave já existe
if [ ! -f ~/.ssh/github_actions_key ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions_key -N "" -C "github-actions-secured-guard"
    log "✅ Chave SSH gerada!"
else
    log "✅ Chave SSH já existe!"
fi

# ========================================
# 2. MOSTRAR CHAVE PÚBLICA
# ========================================
log "2. Chave pública para adicionar na VPS:"
echo ""
cat ~/.ssh/github_actions_key.pub
echo ""

# ========================================
# 3. MOSTRAR CHAVE PRIVADA
# ========================================
log "3. Chave privada para adicionar no GitHub Secrets:"
echo ""
cat ~/.ssh/github_actions_key
echo ""

# ========================================
# 4. INSTRUÇÕES
# ========================================
log "4. Instruções para configuração:"
echo ""
info "📋 PASSOS PARA CONFIGURAR:"
echo ""
info "1. VPS (185.225.233.18):"
echo "   - Adicione a chave pública acima no arquivo ~/.ssh/authorized_keys"
echo "   - Comando: echo 'CHAVE_PUBLICA_AQUI' >> ~/.ssh/authorized_keys"
echo ""
info "2. GitHub Repository:"
echo "   - Vá para Settings > Secrets and variables > Actions"
echo "   - Adicione os seguintes secrets:"
echo ""
echo "   VPS_SSH_KEY:"
echo "   [Cole a chave privada completa aqui]"
echo ""
echo "   VPS_HOST:"
echo "   185.225.233.18"
echo ""
echo "   VPS_USER:"
echo "   securedguard"
echo ""
echo "   VPS_PORT:"
echo "   22"
echo ""
info "3. Branches do repositório:"
echo "   - ci: Para deploy no ambiente CI"
echo "   - develop/dev: Para deploy no ambiente DEV"
echo "   - main/master/production: Para deploy no ambiente PROD"
echo ""
info "4. URLs dos ambientes:"
echo "   - CI: https://ci.z7botsolutions.com.br"
echo "   - DEV: https://dev.z7botsolutions.com.br"
echo "   - PROD: https://prod.z7botsolutions.com.br"
echo ""

# ========================================
# 5. TESTAR CONEXÃO
# ========================================
log "5. Testando conexão SSH..."
if ssh -i ~/.ssh/github_actions_key -o ConnectTimeout=10 -o StrictHostKeyChecking=no securedguard@185.225.233.18 "echo 'SSH Test OK'" 2>/dev/null; then
    log "✅ Conexão SSH funcionando!"
else
    warning "⚠️  Conexão SSH não funcionou. Verifique se a chave foi adicionada na VPS."
fi

# ========================================
# 6. CRIAR BRANCHES
# ========================================
log "6. Criando branches para CI/CD..."
echo ""
info "Execute estes comandos para criar as branches:"
echo ""
echo "git checkout -b ci"
echo "git push origin ci"
echo ""
echo "git checkout -b develop"
echo "git push origin develop"
echo ""
echo "git checkout -b production"
echo "git push origin production"
echo ""

log "Configuração concluída!"
echo ""
warning "IMPORTANTE: Configure os secrets no GitHub antes de fazer push!"
