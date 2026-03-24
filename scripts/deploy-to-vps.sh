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

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_PORT" ]; then
    error "Variáveis de ambiente VPS_HOST, VPS_USER e VPS_PORT devem estar definidas!"
fi

log "🚀 Iniciando deploy para VPS..."
log "📡 Host: $VPS_HOST"
log "👤 Usuário: $VPS_USER"
log "🔌 Porta: $VPS_PORT"

# ========================================
# 1. CONFIGURAR SSH
# ========================================
log "1. Configurando SSH..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts

# Adicionar chave do host VPS
log "🔑 Adicionando chave do host VPS..."
ssh-keyscan -p $VPS_PORT $VPS_HOST >> ~/.ssh/known_hosts

# Verificar conexão SSH
log "🔍 Testando conexão SSH..."
ssh -p $VPS_PORT -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST "echo 'SSH OK'"
log "✅ Conexão SSH funcionando!"

# ========================================
# 2. COPIAR ARQUIVOS PARA VPS
# ========================================
log "2. Copiando arquivos para VPS..."

# Criar diretório se não existir
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "mkdir -p /opt/secured-guard"

# Copiar script de deploy
scp -P $VPS_PORT deploy.sh $VPS_USER@$VPS_HOST:/opt/secured-guard/

# Copiar docker-compose
scp -P $VPS_PORT deploy/docker-compose.prod.yml $VPS_USER@$VPS_HOST:/opt/secured-guard/

log "✅ Arquivos copiados!"

# ========================================
# 3. EXECUTAR DEPLOY NA VPS
# ========================================
log "3. Executando deploy na VPS..."
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "
    cd /opt/secured-guard &&
    chmod +x deploy.sh &&
    ./deploy.sh
"

log "✅ Deploy executado na VPS!"

# ========================================
# 4. VERIFICAR DEPLOYMENT
# ========================================
log "4. Verificando deployment..."
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "
    cd /opt/secured-guard &&
    echo '📊 Status dos serviços:' &&
    docker compose -f deploy/docker-compose.prod.yml ps &&
    echo '📝 Último commit:' &&
    git log --oneline -1
"

log "✅ Verificação concluída!"

# ========================================
# 5. TESTAR APLICAÇÃO
# ========================================
log "5. Testando aplicação..."
if curl -f -s https://securedguard.z7botsolutions.com.br > /dev/null; then
    log "✅ Aplicação web está funcionando!"
    log "🌐 URL: https://securedguard.z7botsolutions.com.br"
else
    warn "⚠️ Aplicação web pode estar com problema, mas VPS está funcionando"
fi

log "🎉 Deploy concluído com sucesso!"
log "📱 Aplicação disponível em: https://securedguard.z7botsolutions.com.br"
log "📊 Status: VPS atualizada com sucesso"
