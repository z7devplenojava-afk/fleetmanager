#!/bin/bash

# ========================================
# SCRIPT PARA DEPLOY COM DOMÍNIOS ESPECÍFICOS
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

# Domínios configurados
PROD_DOMAIN="securedguard.z7botsolutions.com.br"
DEV_DOMAIN="dev.z7botsolutions.com.br"
CI_DOMAIN="ci.z7botsolutions.com.br"

log "Deploy com domínios específicos"
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
log "4. Verificando/criando usuário na VPS..."

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
# 5. EXECUTAR INSTALAÇÃO
# ========================================
log "5. Executando instalação na VPS..."

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
# 7. CONFIGURAR ARQUIVO .ENV
# ========================================
log "7. Configurando variáveis de ambiente..."

# Configurar arquivo .env com domínios
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
    cat > /opt/secured-guard/.env << 'EOF'
# ========================================
# CONFIGURAÇÕES DE PRODUÇÃO
# ========================================

# Database
POSTGRES_DB=secured_guard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRATION=86400000

# Domínios
PROD_DOMAIN=$PROD_DOMAIN
DEV_DOMAIN=$DEV_DOMAIN
CI_DOMAIN=$CI_DOMAIN

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Logs
LOG_LEVEL=INFO
LOG_FILE_PATH=/app/logs
EOF
    echo '✅ Arquivo .env configurado!'
"

log "✅ Variáveis de ambiente configuradas!"

# ========================================
# 8. SELECIONAR AMBIENTE PARA DEPLOY
# ========================================
echo ""
info "Qual ambiente você quer fazer deploy?"
echo "1) Produção (securedguard.z7botsolutions.com.br)"
echo "2) Desenvolvimento (dev.z7botsolutions.com.br)"
echo "3) CI/Testes (ci.z7botsolutions.com.br)"
echo "4) Todos os ambientes"
echo ""
read -p "Escolha (1-4): " ENV_CHOICE

case $ENV_CHOICE in
    1)
        ENV_FILE="docker-compose.prod-domains.yml"
        ENV_NAME="Produção"
        ;;
    2)
        ENV_FILE="docker-compose.dev-domains.yml"
        ENV_NAME="Desenvolvimento"
        ;;
    3)
        ENV_FILE="docker-compose.ci-domains.yml"
        ENV_NAME="CI/Testes"
        ;;
    4)
        ENV_FILE="all"
        ENV_NAME="Todos os ambientes"
        ;;
    *)
        error "Opção inválida!"
        ;;
esac

# ========================================
# 9. EXECUTAR DEPLOY
# ========================================
log "9. Executando deploy para $ENV_NAME..."

if [ "$ENV_FILE" = "all" ]; then
    # Deploy todos os ambientes
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker-compose -f deploy/docker-compose.prod-domains.yml up -d"
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker-compose -f deploy/docker-compose.dev-domains.yml up -d"
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker-compose -f deploy/docker-compose.ci-domains.yml up -d"
else
    # Deploy ambiente específico
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker-compose -f deploy/$ENV_FILE up -d"
fi

log "Deploy concluído!"

# ========================================
# 10. VERIFICAR STATUS
# ========================================
log "10. Verificando status dos serviços..."

if [ "$ENV_FILE" = "all" ]; then
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker ps --filter 'name=secured-guard'"
else
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /opt/secured-guard && docker-compose -f deploy/$ENV_FILE ps"
fi

# ========================================
# FINALIZAÇÃO
# ========================================
log "Deploy concluído com sucesso!"
echo ""
info "Acesse sua aplicação em:"
echo "🌐 Produção: https://$PROD_DOMAIN"
echo "🔧 Desenvolvimento: https://$DEV_DOMAIN"
echo "🧪 CI/Testes: https://$CI_DOMAIN"
echo ""
info "Gerenciamento:"
echo "📊 Portainer: https://$VPS_HOST:9000"
echo "🔧 Traefik Dashboard: https://$VPS_HOST:8080"
echo ""
info "Comandos úteis:"
echo "- Conectar na VPS: ssh $NEW_USER@$VPS_HOST"
echo "- Ver logs produção: ssh $NEW_USER@$VPS_HOST 'docker-compose -f /opt/secured-guard/deploy/docker-compose.prod-domains.yml logs -f'"
echo "- Ver logs desenvolvimento: ssh $NEW_USER@$VPS_HOST 'docker-compose -f /opt/secured-guard/deploy/docker-compose.dev-domains.yml logs -f'"
echo "- Ver logs CI: ssh $NEW_USER@$VPS_HOST 'docker-compose -f /opt/secured-guard/deploy/docker-compose.ci-domains.yml logs -f'"
echo ""
warning "IMPORTANTE: Configure os DNS dos domínios para apontar para o IP da VPS: $VPS_HOST"
