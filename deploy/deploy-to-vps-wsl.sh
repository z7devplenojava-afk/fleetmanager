#!/bin/bash

# ========================================
# SCRIPT WSL PARA DEPLOY NA VPS
# Execute este script no WSL
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

# Verificar se estamos no WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    warning "Este script é otimizado para WSL. Continuando mesmo assim..."
fi

# Verificar se estamos no diretório correto
if [ ! -f "deploy/install-vps.sh" ]; then
    error "Execute este script a partir do diretório raiz do projeto FluxBus"
fi

# Verificar se o usuário tem SSH configurado
if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ]; then
    echo "Configuração da VPS:"
    read -p "IP da VPS:185.225.233.18" VPS_HOST
    read -p "Usuário SSH: root" VPS_USER
    read -p "Porta SSH (padrão 22):22 " VPS_PORT
    VPS_PORT=${VPS_PORT:-22}
fi

log "Iniciando deploy para VPS: $VPS_USER@$VPS_HOST:$VPS_PORT"

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
    echo ""
    info "Para configurar chave SSH:"
    echo "ssh-keygen -t rsa -b 4096 -C 'seu-email@exemplo.com'"
    echo "ssh-copy-id -p $VPS_PORT $VPS_USER@$VPS_HOST"
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

# Usar rsync para copiar apenas arquivos necessários (mais eficiente no WSL)
rsync -avz --delete \
    --exclude-from=.rsync-exclude.temp \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='target/' \
    --exclude='*.log' \
    --exclude='uploads/' \
    --exclude='logs/' \
    --exclude='backups/' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    --exclude='*.swp' \
    --exclude='*.swo' \
    --exclude='*~' \
    -e "ssh -p $VPS_PORT" \
    ./ $VPS_USER@$VPS_HOST:/opt/fluxbus/

# Limpar arquivo temporário
rm -f .rsync-exclude.temp

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
# 6. TESTAR APLICAÇÃO
# ========================================
log "Testando aplicação..."

# Aguardar um pouco para os serviços ficarem prontos
sleep 10

# Testar backend
if curl -s -f "http://$VPS_HOST:8080/actuator/health" > /dev/null; then
    log "✅ Backend está funcionando!"
else
    warning "⚠️  Backend pode não estar funcionando ainda. Verifique os logs."
fi

# Testar frontend
if curl -s -f "http://$VPS_HOST/" > /dev/null; then
    log "✅ Frontend está funcionando!"
else
    warning "⚠️  Frontend pode não estar funcionando ainda. Verifique os logs."
fi

# ========================================
# FINALIZAÇÃO
# ========================================
log "Deploy concluído com sucesso!"
echo ""
info "Acesse sua aplicação em:"
echo "🌐 http://$VPS_HOST (HTTP)"
echo "🔒 https://$VPS_HOST (HTTPS - self-signed)"
echo ""
info "Comandos úteis na VPS:"
echo "- Ver logs: docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml logs -f"
echo "- Status: docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml ps"
echo "- Backup: /opt/fluxbus/backup.sh"
echo "- Restart: cd /opt/fluxbus && ./deploy.sh"
echo ""
info "Comandos úteis no WSL:"
echo "- Conectar na VPS: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
echo "- Ver logs remotos: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml logs -f'"
echo "- Fazer backup remoto: ssh -p $VPS_PORT $VPS_USER@$VPS_HOST '/opt/fluxbus/backup.sh'"
echo ""
warning "IMPORTANTE: Configure seu domínio e certificados SSL reais para produção!"
echo ""
info "Para configurar domínio:"
echo "1. Aponte seu domínio para o IP: $VPS_HOST"
echo "2. Edite /opt/fluxbus/.env e adicione: DOMAIN=seudominio.com"
echo "3. Configure certificados SSL reais com Let's Encrypt"
