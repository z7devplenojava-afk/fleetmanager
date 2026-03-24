#!/bin/bash

# ========================================
# SCRIPT PARA CRIAR USUÁRIO E FAZER DEPLOY
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
NEW_USER="securedguard"

log "Criando usuário e fazendo deploy..."
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
# 4. CRIAR USUÁRIO NA VPS
# ========================================
log "4. Criando usuário na VPS..."

# Criar usuário
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
    # Criar usuário se não existir
    if ! id '$NEW_USER' &>/dev/null; then
        useradd -m -s /bin/bash '$NEW_USER'
        usermod -aG sudo '$NEW_USER'
        usermod -aG docker '$NEW_USER' 2>/dev/null || true
        echo '$NEW_USER ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
        echo '✅ Usuário $NEW_USER criado!'
    else
        echo '✅ Usuário $NEW_USER já existe!'
    fi
"

log "✅ Usuário criado na VPS!"

# ========================================
# 5. EXECUTAR INSTALAÇÃO COM NOVO USUÁRIO
# ========================================
log "5. Executando instalação com usuário $NEW_USER..."

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
# 6. COPIAR CÓDIGO DO PROJETO
# ========================================
log "6. Copiando código do projeto para VPS..."

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
    ./ $VPS_USER@$VPS_HOST:/opt/secured-guard/

# Limpar arquivo temporário
rm -f .rsync-exclude.temp

log "Código copiado para VPS!"

# ========================================
# 7. EXECUTAR DEPLOY
# ========================================
log "7. Executando deploy na VPS..."

sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && ./deploy.sh"

log "Deploy concluído!"

# ========================================
# 8. VERIFICAR STATUS
# ========================================
log "8. Verificando status dos serviços..."

sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker compose -f deploy/docker-compose.prod.yml ps"

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
echo "- Conectar na VPS: ssh $NEW_USER@$VPS_HOST"
echo "- Ver logs: ssh $NEW_USER@$VPS_HOST 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f'"
echo "- Status: ssh $NEW_USER@$VPS_HOST 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml ps'"
echo ""
warning "IMPORTANTE: Configure seu domínio e certificados SSL reais para produção!"
