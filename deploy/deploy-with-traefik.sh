#!/bin/bash

# ========================================
# SCRIPT PARA DEPLOY COM TRAEFIK E PORTAINER
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

# Configurações
VPS_HOST="185.225.233.18"
VPS_USER="root"
VPS_PORT="22"
VPS_PASSWORD='$7?NMo8&Ua'

log "Deploy com Traefik e Portainer"
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
# 4. VERIFICAR TRAEFIK E PORTAINER
# ========================================
log "4. Verificando Traefik e Portainer na VPS..."

# Verificar se Traefik está rodando
if sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "docker ps | grep traefik" > /dev/null; then
    log "✅ Traefik está rodando!"
else
    warning "⚠️  Traefik não está rodando ou não encontrado"
fi

# Verificar se Portainer está rodando
if sshpass -p "$VPS_PORT" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "docker ps | grep portainer" > /dev/null; then
    log "✅ Portainer está rodando!"
else
    warning "⚠️  Portainer não está rodando ou não encontrado"
fi

# ========================================
# 5. CRIAR USUÁRIO NA VPS
# ========================================
log "5. Verificando/criando usuário na VPS..."

NEW_USER="fluxbus"

# Criar usuário se não existir
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
    if ! id '$NEW_USER' &>/dev/null; then
        useradd -m -s /bin/bash '$NEW_USER'
        usermod -aG sudo '$NEW_USER'
        usermod -aG docker '$NEW_USER'
        echo '$NEW_USER ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
        echo '✅ Usuário $NEW_USER criado!'
    else
        echo '✅ Usuário $NEW_USER já existe!'
    fi
"

log "✅ Usuário verificado/criado na VPS!"

# ========================================
# 6. EXECUTAR INSTALAÇÃO
# ========================================
log "6. Executando instalação na VPS..."

# Copiar script de instalação
sshpass -p "$VPS_PASSWORD" scp -P $VPS_PORT -o StrictHostKeyChecking=no deploy/install-vps.sh $VPS_USER@$VPS_HOST:/tmp/

# Executar instalação com o novo usuário
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
    # Copiar script para o usuário
    cp /tmp/install-vps.sh /home/$NEW_USER/
    chown $NEW_USER:$NEW_USER /home/$NEW_USER/install-vps.sh
    chmod +x /home/$NEW_USER/install-vps.sh
    
    # Executar como o novo usuário
    sudo -u $NEW_USER /home/$NEW_USER/install-vps.sh
"

log "Instalação na VPS concluída!"

# ========================================
# 7. COPIAR CÓDIGO DO PROJETO
# ========================================
log "7. Copiando código do projeto para VPS..."

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
# 8. CONFIGURAR DOMÍNIO
# ========================================
log "8. Configurando domínio..."

# Solicitar domínio
echo ""
read -p "Digite seu domínio (ex: meusite.com): " DOMAIN

if [ -n "$DOMAIN" ]; then
    log "Configurando domínio: $DOMAIN"
    
    # Adicionar domínio ao arquivo .env
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
        echo 'DOMAIN=$DOMAIN' >> /opt/fluxbus/.env
        echo '✅ Domínio configurado!'
    "
else
    log "Usando localhost como domínio"
fi

# ========================================
# 9. EXECUTAR DEPLOY COM TRAEFIK
# ========================================
log "9. Executando deploy com Traefik..."

sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/fluxbus && docker-compose -f deploy/docker-compose.prod-traefik.yml up -d"

log "Deploy com Traefik concluído!"

# ========================================
# 10. VERIFICAR STATUS
# ========================================
log "10. Verificando status dos serviços..."

sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/fluxbus && docker-compose -f deploy/docker-compose.prod-traefik.yml ps"

# ========================================
# FINALIZAÇÃO
# ========================================
log "Deploy concluído com sucesso!"
echo ""
info "Acesse sua aplicação em:"
if [ -n "$DOMAIN" ]; then
    echo "🌐 https://$DOMAIN (Frontend)"
    echo "🔧 https://api.$DOMAIN (Backend API)"
else
    echo "🌐 https://localhost (Frontend)"
    echo "🔧 https://localhost/api (Backend API)"
fi
echo ""
info "Gerenciamento:"
echo "📊 Portainer: https://$VPS_HOST:9000"
echo "🔧 Traefik Dashboard: https://$VPS_HOST:8080"
echo ""
info "Comandos úteis:"
echo "- Conectar na VPS: ssh $NEW_USER@$VPS_HOST"
echo "- Ver logs: ssh $NEW_USER@$VPS_HOST 'docker-compose -f /opt/fluxbus/deploy/docker-compose.prod-traefik.yml logs -f'"
echo "- Status: ssh $NEW_USER@$VPS_HOST 'docker-compose -f /opt/fluxbus/deploy/docker-compose.prod-traefik.yml ps'"
echo ""
warning "IMPORTANTE: Configure seu domínio para apontar para o IP da VPS: $VPS_HOST"
