#!/bin/bash

# ========================================
# SCRIPT WSL PARA DEPLOY COM SENHA
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
    error "Execute este script a partir do diretório raiz do projeto SecuredGuard"
fi

# Configurações
VPS_HOST="185.225.233.18"
VPS_USER="root"
VPS_PORT="22"

log "Deploy com autenticação por senha"
echo ""

# ========================================
# 1. CONFIGURAR SSH
# ========================================
log "1. Configurando SSH..."

# Criar diretório SSH
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts

# Adicionar chave do host
ssh-keyscan -p $VPS_PORT $VPS_HOST >> ~/.ssh/known_hosts

log "✅ SSH configurado!"

# ========================================
# 2. TESTAR CONEXÃO
# ========================================
log "2. Testando conexão SSH..."
echo "Você será solicitado a digitar a senha do root da VPS"
echo ""

# Testar conexão
if ssh -p $VPS_PORT -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH OK'"; then
    log "✅ Conexão SSH funcionando!"
else
    error "❌ Não foi possível conectar via SSH"
fi

# ========================================
# 3. EXECUTAR INSTALAÇÃO NA VPS
# ========================================
log "3. Executando instalação na VPS..."

# Copiar script de instalação
log "Copiando script de instalação..."
scp -P $VPS_PORT deploy/install-vps.sh $VPS_USER@$VPS_HOST:/tmp/

# Executar instalação
log "Executando instalação (você será solicitado a digitar a senha novamente)..."
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "chmod +x /tmp/install-vps.sh && /tmp/install-vps.sh"

log "Instalação na VPS concluída!"

# ========================================
# 4. COPIAR CÓDIGO DO PROJETO
# ========================================
log "4. Copiando código do projeto para VPS..."

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
log "Sincronizando arquivos (você será solicitado a digitar a senha novamente)..."
rsync -avz --delete \
    --exclude-from=.rsync-exclude.temp \
    -e "ssh -p $VPS_PORT" \
    ./ $VPS_USER@$VPS_HOST:/opt/secured-guard/

# Limpar arquivo temporário
rm -f .rsync-exclude.temp

log "Código copiado para VPS!"

# ========================================
# 5. EXECUTAR DEPLOY
# ========================================
log "5. Executando deploy na VPS..."

ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd /opt/secured-guard && ./deploy.sh"

log "Deploy concluído!"

# ========================================
# 6. VERIFICAR STATUS
# ========================================
log "6. Verificando status dos serviços..."

ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker compose -f deploy/docker-compose.prod.yml ps"

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
echo "- Ver logs: ssh root@$VPS_HOST 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f'"
echo "- Status: ssh root@$VPS_HOST 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml ps'"
echo ""
warning "IMPORTANTE: Configure seu domínio e certificados SSL reais para produção!"
