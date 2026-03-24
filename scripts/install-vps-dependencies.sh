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

log "🚀 Iniciando instalação de dependências na VPS..."

# ========================================
# 1. ATUALIZAR SISTEMA
# ========================================
log "1. Atualizando sistema Ubuntu..."
apt update && apt upgrade -y
log "✅ Sistema atualizado!"

# ========================================
# 2. INSTALAR DEPENDÊNCIAS BÁSICAS
# ========================================
log "2. Instalando dependências básicas..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
log "✅ Dependências básicas instaladas!"

# ========================================
# 3. INSTALAR JAVA 17
# ========================================
log "3. Instalando Java 17..."
apt install -y openjdk-17-jdk
java -version
log "✅ Java 17 instalado!"

# ========================================
# 4. INSTALAR MAVEN
# ========================================
log "4. Instalando Maven..."
apt install -y maven
mvn -version
log "✅ Maven instalado!"

# ========================================
# 5. INSTALAR NODE.JS 18
# ========================================
log "5. Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version
npm --version
log "✅ Node.js 18 instalado!"

# ========================================
# 6. INSTALAR DOCKER
# ========================================
log "6. Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker
docker --version
docker compose version
log "✅ Docker instalado!"

# ========================================
# 7. INSTALAR POSTGRESQL
# ========================================
log "7. Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
log "✅ PostgreSQL instalado!"

# ========================================
# 8. CONFIGURAR POSTGRESQL
# ========================================
log "8. Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE secured_guard;"
sudo -u postgres psql -c "CREATE USER secured_guard WITH PASSWORD 'secured_guard_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE secured_guard TO secured_guard;"
sudo -u postgres psql -c "ALTER USER secured_guard CREATEDB;"
log "✅ PostgreSQL configurado!"

# ========================================
# 9. CRIAR DIRETÓRIO DO PROJETO
# ========================================
log "9. Criando diretório do projeto..."
mkdir -p /opt/secured-guard
chown -R $USER:$USER /opt/secured-guard
log "✅ Diretório criado!"

# ========================================
# 10. CONFIGURAR SSH
# ========================================
log "10. Configurando SSH..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts
log "✅ SSH configurado!"

# ========================================
# 11. INSTALAR NGINX (OPCIONAL)
# ========================================
log "11. Instalando Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log "✅ Nginx instalado!"

# ========================================
# 12. CONFIGURAR FIREWALL
# ========================================
log "12. Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw allow 3000/tcp
ufw --force enable
log "✅ Firewall configurado!"

# ========================================
# 13. VERIFICAR INSTALAÇÕES
# ========================================
log "13. Verificando instalações..."
echo "Java: $(java -version 2>&1 | head -n 1)"
echo "Maven: $(mvn -version | head -n 1)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker compose version)"
echo "PostgreSQL: $(sudo -u postgres psql -c 'SELECT version();' | head -n 3 | tail -n 1)"

log "🎉 Instalação completa! VPS pronta para deploy!"
log "📁 Diretório do projeto: /opt/secured-guard"
log "🐘 Banco de dados: secured_guard"
log "👤 Usuário do banco: secured_guard"
log "🔑 Senha do banco: secured_guard_password"
