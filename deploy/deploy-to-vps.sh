#!/bin/bash

# ========================================
# SCRIPT PARA FAZER DEPLOY NA VPS
# Execute este script APÓS rodar install-vps.sh
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

# Verificar se o usuário tem SSH configurado
if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ]; then
    # Se executando localmente na VPS, usar configurações padrão
    if [ "$VPS_LOCAL" = "1" ]; then
        VPS_HOST="localhost"
        VPS_USER="root"
        VPS_PORT="22"
        log "Executando deploy local na VPS..."
    else
        echo "Configuração da VPS:"
        read -p "IP da VPS: " VPS_HOST
        read -p "Usuário SSH: " VPS_USER
        read -p "Porta SSH (padrão 22): " VPS_PORT
        VPS_PORT=${VPS_PORT:-22}
    fi
fi

log "Iniciando deploy para VPS: $VPS_USER@$VPS_HOST:$VPS_PORT"

# Se executando localmente na VPS, pular SSH e ir direto para deploy
if [ "$VPS_LOCAL" = "1" ]; then
    log "Executando deploy localmente na VPS..."
    
    # ========================================
    # DEPLOY LOCAL NA VPS
    # ========================================
    
    # Verificar se arquivo .env existe
    if [ ! -f ".env" ]; then
        error "Arquivo .env não encontrado! Execute install-vps.sh primeiro."
    fi
    
    # Parar containers existentes
    log "Parando containers existentes..."
    docker compose -f deploy/docker-compose.prod.yml down 2>/dev/null || true
    
    # Build e subir containers
    log "Fazendo build e subindo containers..."
    docker compose -f deploy/docker-compose.prod.yml up -d --build
    
    # Aguardar serviços ficarem prontos
    log "Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Verificar status
    log "Verificando status dos serviços..."
    docker compose -f deploy/docker-compose.prod.yml ps
    
    log "Deploy local concluído com sucesso!"
    exit 0
fi

# ========================================
# 1. TESTAR CONEXÃO SSH
# ========================================
log "Testando conexão SSH..."
if ! ssh -p $VPS_PORT -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST exit 2>/dev/null; then
    error "Não foi possível conectar à VPS. Verifique:"
    echo "- IP da VPS: $VPS_HOST"
    echo "- Usuário: $VPS_USER"
    echo "- Porta: $VPS_PORT"
    echo "- Chave SSH configurada"
fi

log "Conexão SSH OK!"

# ========================================
# 2. EXECUTAR INSTALAÇÃO NA VPS
# ========================================
log "Executando instalação na VPS..."

# Copiar script de instalação
scp -P $VPS_PORT deploy/install-vps.sh $VPS_USER@$VPS_HOST:/tmp/

# Executar instalação
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "chmod +x /tmp/install-vps.sh && /tmp/install-vps.sh"

log "Instalação na VPS concluída!"

# ========================================
# 3. COPIAR CÓDIGO DO PROJETO
# ========================================
log "Copiando código do projeto para VPS..."

# Criar arquivo .gitignore temporário para não copiar arquivos desnecessários
cat > .gitignore.temp << EOF
node_modules/
target/
.git/
*.log
*.tmp
.env
uploads/
logs/
backups/
EOF

# Fazer backup do .gitignore original
cp .gitignore .gitignore.backup 2>/dev/null || true

# Usar rsync para copiar apenas arquivos necessários
rsync -avz --delete \
    --exclude-from=.gitignore.temp \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='target/' \
    --exclude='*.log' \
    --exclude='uploads/' \
    --exclude='logs/' \
    --exclude='backups/' \
    -e "ssh -p $VPS_PORT" \
    ./ $VPS_USER@$VPS_HOST:/opt/fluxbus/

# Restaurar .gitignore original
mv .gitignore.backup .gitignore 2>/dev/null || true
rm -f .gitignore.temp

log "Código copiado para VPS!"

# ========================================
# 4. EXECUTAR DEPLOY
# ========================================
log "Executando deploy na VPS..."

ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd /opt/fluxbus && ./deploy.sh"

log "Deploy concluído!"

# ========================================
# 5. VERIFICAR STATUS
# ========================================
log "Verificando status dos serviços..."

ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd /opt/fluxbus && docker compose -f deploy/docker-compose.prod.yml ps"

# ========================================
# FINALIZAÇÃO
# ========================================
log "Deploy concluído com sucesso!"
echo ""
info "Acesse sua aplicação em:"
echo "🌐 https://$VPS_HOST"
echo ""
info "Comandos úteis na VPS:"
echo "- Ver logs: docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml logs -f"
echo "- Status: docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml ps"
echo "- Backup: /opt/fluxbus/backup.sh"
echo "- Restart: cd /opt/fluxbus && ./deploy.sh"
echo ""
warning "IMPORTANTE: Configure seu domínio e certificados SSL reais para produção!"
