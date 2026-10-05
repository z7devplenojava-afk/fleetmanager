#!/bin/bash

# ========================================
# SCRIPT WSL PARA DEPLOY COM SSHPASS
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

# Verificar se estamos no diretório correto
if [ ! -f "deploy/install-vps.sh" ]; then
    error "Execute este script a partir do diretório raiz do projeto FluxBus"
fi

# Configurações (usar variáveis de ambiente se disponíveis)
VPS_HOST="${VPS_HOST:-185.225.233.18}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
VPS_PASSWORD="${VPS_PASSWORD:-$7?NMo8&Ua}"

log "Deploy com sshpass (automação de senha)"
echo ""
info "Configurações:"
info "  VPS_HOST: $VPS_HOST"
info "  VPS_USER: $VPS_USER"
info "  VPS_PORT: $VPS_PORT"
info "  VPS_PASSWORD: [OCULTO]"
echo ""

# ========================================
# 1. VERIFICAR SSHPASS
# ========================================
log "1. Verificando sshpass..."
if ! command -v sshpass &> /dev/null; then
    log "Instalando sshpass..."
    sudo apt update
    sudo apt install -y sshpass
fi

log "✅ sshpass disponível!"

# ========================================
# 2. CONFIGURAR SSH
# ========================================
log "2. Configurando SSH..."

# Criar diretório SSH
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts

# Adicionar chave do host
ssh-keyscan -p $VPS_PORT $VPS_HOST >> ~/.ssh/known_hosts

log "✅ SSH configurado!"

# ========================================
# 3. TESTAR CONEXÃO
# ========================================
log "3. Testando conexão SSH..."
if sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo 'SSH OK'"; then
    log "✅ Conexão SSH funcionando!"
else
    error "❌ Não foi possível conectar via SSH"
fi

# ========================================
# 4. EXECUTAR INSTALAÇÃO NA VPS
# ========================================
log "4. Executando instalação na VPS..."

# Copiar script de instalação
log "Copiando script de instalação..."
sshpass -p "$VPS_PASSWORD" scp -P $VPS_PORT -o StrictHostKeyChecking=no deploy/install-vps.sh $VPS_USER@$VPS_HOST:/tmp/

# Executar instalação
log "Executando instalação..."
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "chmod +x /tmp/install-vps.sh && /tmp/install-vps.sh"

log "Instalação na VPS concluída!"

# ========================================
# 5. COPIAR CÓDIGO DO PROJETO
# ========================================
log "5. Copiando código do projeto para VPS..."

# Criar arquivo de exclusões
cat > .rsync-exclude.temp << EOF
node_modules/
target/
.git/
*.log
*.tmp
.env
uploads/
logs/
backups/
.DS_Store
Thumbs.db
*.swp
*.swo
*~
EOF

# Usar rsync para copiar arquivos
log "Sincronizando arquivos..."
sshpass -p "$VPS_PASSWORD" rsync -avz --delete \
    --exclude-from=.rsync-exclude.temp \
    -e "ssh -p $VPS_PORT -o StrictHostKeyChecking=no" \
    ./ $VPS_USER@$VPS_HOST:/opt/fluxbus/

# Limpar arquivo temporário
rm -f .rsync-exclude.temp

log "Código copiado para VPS!"

# ========================================
# 6. EXECUTAR DEPLOY
# ========================================
log "6. Executando deploy na VPS..."

# Recriar script deploy.sh com correção e executar
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/fluxbus && cp deploy/deploy-to-vps.sh deploy.sh && chmod +x deploy.sh && VPS_LOCAL=1 ./deploy.sh"

log "Deploy concluído!"

# ========================================
# 7. VERIFICAR STATUS
# ========================================
log "7. Verificando status dos serviços..."

sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/fluxbus && docker compose -f deploy/docker-compose.prod.yml ps"

# ========================================
# FINALIZAÇÃO
# ========================================
log "Deploy concluído com sucesso!"
echo ""
info "Acesse sua aplicação em:"
echo "🌐 http://$VPS_HOST (HTTP)"
echo "🔒 https://$VPS_HOST (HTTPS - self-signed)"
echo ""
info "Comandos úteis:"
echo "- Conectar na VPS: ssh root@$VPS_HOST"
echo "- Ver logs: ssh root@$VPS_HOST 'docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml logs -f'"
echo "- Status: ssh root@$VPS_HOST 'docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml ps'"
echo ""
warning "IMPORTANTE: Configure seu domínio e certificados SSL reais para produção!"
