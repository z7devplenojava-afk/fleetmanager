#!/bin/bash

# ========================================
# SCRIPT DE INSTALAÇÃO COMPLETA NA VPS
# Ubuntu 20.04/22.04 - SecuredGuard
# ========================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando instalação do SecuredGuard na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
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

# Verificar se é root (permitir execução como root na VPS)
if [[ $EUID -eq 0 ]]; then
   warning "⚠️ Executando instalação como root; prosseguindo."
fi

# ========================================
# 1. ATUALIZAR SISTEMA
# ========================================
log "Atualizando sistema..."

# Configurar ambiente não-interativo
export DEBIAN_FRONTEND=noninteractive
export UCF_FORCE_CONFFNEW=1

sudo apt update && sudo apt upgrade -y

# ========================================
# 2. INSTALAR DEPENDÊNCIAS BÁSICAS
# ========================================
log "Instalando dependências básicas..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nano \
    ufw \
    fail2ban

# ========================================
# 3. INSTALAR DOCKER
# ========================================
log "Instalando Docker..."

# Remover versões antigas e chaves existentes
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
sudo rm -f /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório oficial do Docker (não-interativo)
if ! curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --batch --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg; then
    error "Falha ao baixar chave GPG do Docker"
fi

# Verificar se a chave foi criada
if [ ! -f /usr/share/keyrings/docker-archive-keyring.gpg ]; then
    error "Chave GPG do Docker não foi criada"
fi

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Adicionar usuário atual ao grupo docker (se não for root)
if [[ $EUID -ne 0 ]]; then
    sudo usermod -aG docker $USER
fi

# Iniciar e habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

log "Docker instalado com sucesso!"

# ========================================
# 4. INSTALAR DOCKER COMPOSE
# ========================================
log "Instalando Docker Compose..."

# Instalar docker-compose-plugin (já vem com Docker CE)
sudo apt install -y docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

log "Docker Compose instalado com sucesso!"

# ========================================
# 5. CRIAR REDE DOCKER COMPARTILHADA
# ========================================
log "Criando rede Docker compartilhada 'secured-guard' (se não existir)..."

# Criar rede externa para todos os ambientes
if ! docker network ls --format '{{.Name}}' | grep -q '^secured-guard$'; then
  docker network create --driver bridge secured-guard || error "Falha ao criar a rede Docker 'secured-guard'"
  log "Rede 'secured-guard' criada."
else
  log "Rede 'secured-guard' já existe."
fi

# ========================================
# 6. CONFIGURAR FIREWALL
# ========================================
log "Configurando firewall..."

# Resetar UFW
sudo ufw --force reset

# Política padrão
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir portas de desenvolvimento (opcional)
sudo ufw allow 8080/tcp
sudo ufw allow 5173/tcp

# Habilitar firewall
sudo ufw --force enable

log "Firewall configurado!"

# ========================================
# 6. CONFIGURAR FAIL2BAN
# ========================================
log "Configurando Fail2Ban..."

sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

log "Fail2Ban configurado!"

# ========================================
# 7. CRIAR ESTRUTURA DE DIRETÓRIOS
# ========================================
log "Criando estrutura de diretórios..."

# Criar diretório do projeto
sudo mkdir -p /opt/secured-guard
sudo chown $USER:$USER /opt/secured-guard

# Criar diretórios para logs e dados
sudo mkdir -p /var/log/secured-guard
sudo mkdir -p /opt/secured-guard/data
sudo mkdir -p /opt/secured-guard/backups
sudo mkdir -p /opt/secured-guard/ssl

sudo chown -R $USER:$USER /var/log/secured-guard
sudo chown -R $USER:$USER /opt/secured-guard

log "Estrutura de diretórios criada!"

# ========================================
# 8. CONFIGURAR SSL (SELFSIGNED)
# ========================================
log "Configurando certificados SSL..."

# Instalar OpenSSL se não estiver instalado
sudo apt install -y openssl

# Criar certificado self-signed
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/secured-guard/ssl/key.pem \
    -out /opt/secured-guard/ssl/cert.pem \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=SecuredGuard/CN=localhost"

sudo chown $USER:$USER /opt/secured-guard/ssl/*

log "Certificados SSL criados!"

# ========================================
# 9. CRIAR SCRIPT DE DEPLOY
# ========================================
log "Criando script de deploy..."

sudo tee /opt/secured-guard/deploy.sh > /dev/null <<'EOF'
#!/bin/bash

# Script de deploy do SecuredGuard
set -e

PROJECT_DIR="/opt/secured-guard"
ENV_FILE="$PROJECT_DIR/.env"

# Configurar Git para evitar problemas de propriedade
git config --global --add safe.directory /opt/secured-guard

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verificar se estamos no diretório correto
cd $PROJECT_DIR

# Pular atualização Git (código já foi copiado via rsync)
log "1. Código já atualizado via rsync, pulando git pull..."

# Verificar se arquivo .env existe
if [ ! -f "$ENV_FILE" ]; then
    error "Arquivo .env não encontrado! Copie o env.example e configure as variáveis."
fi

# Parar containers existentes
log "2. Parando containers existentes..."
docker compose -f $PROJECT_DIR/deploy/docker-compose.prod.yml down 2>/dev/null || true

# Fazer backup do banco (se existir)
if docker ps -q -f name=secured-guard-db-prod | grep -q .; then
    log "3. Fazendo backup do banco de dados..."
    docker exec secured-guard-db-prod pg_dump -U postgres secured_guard > $PROJECT_DIR/backups/backup_$(date +%Y%m%d_%H%M%S).sql
fi

# Build e subir containers
log "4. Fazendo build e subindo containers..."
cd $PROJECT_DIR
docker compose -f deploy/docker-compose.prod.yml up -d --build

# Aguardar serviços ficarem prontos
log "5. Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status
log "6. Verificando status dos serviços..."
docker compose -f deploy/docker-compose.prod.yml ps

log "Deploy concluído com sucesso!"
log "Acesse: https://localhost"
EOF

sudo chmod +x /opt/secured-guard/deploy.sh
sudo chown $USER:$USER /opt/secured-guard/deploy.sh

log "Script de deploy criado!"

# ========================================
# 10. CRIAR SCRIPT DE BACKUP
# ========================================
log "Criando script de backup..."

sudo tee /opt/secured-guard/backup.sh > /dev/null <<'EOF'
#!/bin/bash

# Script de backup do SecuredGuard
set -e

PROJECT_DIR="/opt/secured-guard"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Cores
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Backup do banco de dados
log "Fazendo backup do banco de dados..."
docker exec secured-guard-db-prod pg_dump -U postgres secured_guard > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos uploads
log "Fazendo backup dos uploads..."
docker run --rm -v secured-guard_backend_uploads_prod:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_backup_$DATE.tar.gz -C /data .

# Backup dos logs
log "Fazendo backup dos logs..."
docker run --rm -v secured-guard_backend_logs_prod:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/logs_backup_$DATE.tar.gz -C /data .

# Limpar backups antigos (manter últimos 7 dias)
log "Limpando backups antigos..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

log "Backup concluído: $BACKUP_DIR"
EOF

sudo chmod +x /opt/secured-guard/backup.sh
sudo chown $USER:$USER /opt/secured-guard/backup.sh

log "Script de backup criado!"

# ========================================
# 11. CONFIGURAR CRON PARA BACKUP
# ========================================
log "Configurando backup automático..."

# Adicionar tarefa de backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/secured-guard/backup.sh >> /var/log/secured-guard/backup.log 2>&1") | crontab -

log "Backup automático configurado!"

# ========================================
# 12. CRIAR ARQUIVO .ENV
# ========================================
log "Criando arquivo .env..."

sudo tee /opt/secured-guard/.env > /dev/null <<EOF
# ========================================
# CONFIGURAÇÕES DE PRODUÇÃO
# ========================================

# Database
POSTGRES_DB=secured_guard
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRATION=86400000

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Logs
LOG_LEVEL=INFO
LOG_FILE_PATH=/app/logs
EOF

sudo chown $USER:$USER /opt/secured-guard/.env
sudo chmod 600 /opt/secured-guard/.env

log "Arquivo .env criado com senhas seguras!"

# ========================================
# FINALIZAÇÃO
# ========================================
log "Instalação concluída com sucesso!"
echo ""
info "Próximos passos:"
echo "1. Faça logout e login novamente para aplicar as permissões do Docker"
echo "2. Clone o repositório do SecuredGuard para /opt/secured-guard"
echo "3. Execute: /opt/secured-guard/deploy.sh"
echo ""
info "Comandos úteis:"
echo "- Deploy: /opt/secured-guard/deploy.sh"
echo "- Backup: /opt/secured-guard/backup.sh"
echo "- Logs: docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f"
echo "- Status: docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml ps"
echo ""
warning "IMPORTANTE: Faça logout e login novamente antes de continuar!"
