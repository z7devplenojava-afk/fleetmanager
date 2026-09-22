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

# Verificar se é Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    error "Este script é específico para Ubuntu Linux!"
fi

log "🐧 Detectado Ubuntu Linux - Iniciando instalação..."

# ========================================
# 1. ATUALIZAR SISTEMA UBUNTU
# ========================================
log "1. Atualizando sistema Ubuntu..."
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
log "✅ Sistema Ubuntu atualizado!"

# ========================================
# 2. INSTALAR JAVA 17 (OpenJDK)
# ========================================
log "2. Instalando Java 17 OpenJDK..."
apt install -y openjdk-17-jdk
java -version
log "✅ Java 17 OpenJDK instalado!"

# ========================================
# 3. INSTALAR MAVEN
# ========================================
log "3. Instalando Maven..."
apt install -y maven
mvn -version
log "✅ Maven instalado!"

# ========================================
# 4. INSTALAR NODE.JS 18 (NodeSource)
# ========================================
log "4. Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version
npm --version
log "✅ Node.js 18 instalado!"

# ========================================
# 5. INSTALAR DOCKER (Docker Inc.)
# ========================================
log "5. Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker
usermod -aG docker $USER
docker --version
docker compose version
log "✅ Docker instalado!"

# ========================================
# 6. INSTALAR POSTGRESQL 15
# ========================================
log "6. Instalando PostgreSQL 15..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
log "✅ PostgreSQL 15 instalado!"

# ========================================
# 7. CONFIGURAR POSTGRESQL
# ========================================
log "7. Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE fluxbus;" || echo "Database já existe"
sudo -u postgres psql -c "CREATE USER fluxbus WITH PASSWORD 'fluxbus_password';" || echo "User já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fluxbus TO fluxbus;"
sudo -u postgres psql -c "ALTER USER fluxbus CREATEDB;"
log "✅ PostgreSQL configurado!"

# ========================================
# 8. CRIAR DIRETÓRIO DO PROJETO
# ========================================
log "8. Criando diretório do projeto..."
mkdir -p /opt/fluxbus
chown -R $USER:$USER /opt/fluxbus
log "✅ Diretório /opt/fluxbus criado!"

# ========================================
# 9. CONFIGURAR SSH
# ========================================
log "9. Configurando SSH..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts
log "✅ SSH configurado!"

# ========================================
# 10. INSTALAR NGINX
# ========================================
log "10. Instalando Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log "✅ Nginx instalado!"

# ========================================
# 11. CONFIGURAR FIREWALL UFW
# ========================================
log "11. Configurando firewall UFW..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw allow 3000/tcp
ufw --force enable
log "✅ Firewall UFW configurado!"

# ========================================
# 12. INSTALAR GIT (se não estiver)
# ========================================
log "12. Verificando Git..."
if ! command -v git &> /dev/null; then
    apt install -y git
fi
git --version
log "✅ Git verificado!"

# ========================================
# 13. VERIFICAR INSTALAÇÕES
# ========================================
log "13. Verificando instalações..."
echo "🐧 Ubuntu: $(lsb_release -d | cut -f2)"
echo "☕ Java: $(java -version 2>&1 | head -n 1)"
echo "🔨 Maven: $(mvn -version | head -n 1)"
echo "📦 Node.js: $(node --version)"
echo "📦 npm: $(npm --version)"
echo "🐳 Docker: $(docker --version)"
echo "🐳 Docker Compose: $(docker compose version)"
echo "🐘 PostgreSQL: $(sudo -u postgres psql -c 'SELECT version();' | head -n 3 | tail -n 1)"
echo "🌐 Nginx: $(nginx -v 2>&1)"
echo "📁 Git: $(git --version)"

log "🎉 Instalação completa no Ubuntu!"
log "📁 Diretório do projeto: /opt/fluxbus"
log "🐘 Banco de dados: fluxbus"
log "👤 Usuário do banco: fluxbus"
log "🔑 Senha do banco: fluxbus_password"
log "🌐 Nginx rodando na porta 80"
log "🔒 Firewall UFW ativo"

log "💡 Próximos passos:"
log "1. Configure os secrets no GitHub (VPS_HOST, VPS_USER, VPS_PORT)"
log "2. Faça commit na branch main"
log "3. O deploy automático será executado!"
