#!/bin/bash

# ========================================
# INSTALAÇÃO COMPLETA MULTI-AMBIENTE
# SecuredGuard - VPS Multi-Environment Setup
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    error "Execute como root: sudo $0"
    exit 1
fi

log "Iniciando instalação completa do SecuredGuard Multi-Environment..."

# 1. Instalar dependências
log "Instalando dependências..."
apt-get update
apt-get install -y curl wget git unzip

# 2. Instalar Docker se não estiver instalado
if ! command -v docker &> /dev/null; then
    log "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Adicionar usuário ao grupo docker
    usermod -aG docker $SUDO_USER
else
    log "Docker já está instalado"
fi

# 3. Instalar Docker Compose se não estiver instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    log "Docker Compose já está instalado"
fi

# 4. Criar diretórios necessários
log "Criando diretórios..."
mkdir -p /opt/secured-guard/{backups,logs,ssl}
mkdir -p /opt/secured-guard/deploy/nginx/{ssl,logs}

# 5. Configurar SSL self-signed
log "Configurando SSL self-signed..."
if [ ! -f /opt/secured-guard/deploy/nginx/ssl/cert.pem ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /opt/secured-guard/deploy/nginx/ssl/key.pem \
        -out /opt/secured-guard/deploy/nginx/ssl/cert.pem \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=SecuredGuard/CN=localhost"
    log "Certificados SSL criados"
else
    log "Certificados SSL já existem"
fi

# 6. Tornar scripts executáveis
log "Configurando permissões..."
chmod +x /opt/secured-guard/deploy/manage-multi-env.sh
chmod +x /opt/secured-guard/deploy/*.sh

# 7. Instalar serviço systemd
log "Instalando serviço systemd..."
cp /opt/secured-guard/deploy/secured-guard-multi-env.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable secured-guard-multi-env.service

# 8. Configurar firewall
log "Configurando firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp # DEV Frontend
ufw allow 3001/tcp # CI Frontend
ufw allow 8080/tcp # PROD Backend
ufw allow 8081/tcp # DEV Backend
ufw allow 8082/tcp # CI Backend
ufw allow 5432/tcp # DEV Database
ufw allow 5433/tcp # PROD Database
ufw allow 5434/tcp # CI Database

# 9. Parar serviços existentes se estiverem rodando
log "Parando serviços existentes..."
cd /opt/secured-guard
docker compose -f deploy/docker-compose.prod.yml down 2>/dev/null || true
docker compose -f deploy/docker-compose.dev.yml down 2>/dev/null || true
docker compose -f deploy/docker-compose.ci.yml down 2>/dev/null || true

# 10. Limpar containers e volumes antigos
log "Limpando containers antigos..."
docker system prune -f
docker volume prune -f

# 11. Reparar Flyway em todos os ambientes
log "Reparando Flyway em todos os ambientes..."
cd /opt/secured-guard
./deploy/manage-multi-env.sh repair-flyway

# 12. Iniciar todos os ambientes
log "Iniciando todos os ambientes..."
./deploy/manage-multi-env.sh start

# 13. Aguardar serviços ficarem prontos
log "Aguardando serviços ficarem prontos..."
sleep 30

# 14. Verificar saúde dos serviços
log "Verificando saúde dos serviços..."
./deploy/manage-multi-env.sh health

# 15. Mostrar status final
log "Instalação concluída! Status dos serviços:"
./deploy/manage-multi-env.sh status

echo ""
log "🎉 Instalação completa do SecuredGuard Multi-Environment!"
echo ""
info "URLs dos ambientes:"
echo "  🟢 DESENVOLVIMENTO:"
echo "    - Frontend: http://localhost:3000"
echo "    - Backend:  http://localhost:8081"
echo "    - Database: localhost:5432"
echo ""
echo "  🔴 PRODUÇÃO:"
echo "    - Frontend: http://localhost:80"
echo "    - Backend:  http://localhost:8080"
echo "    - Database: localhost:5433"
echo ""
echo "  🟡 CI/CD:"
echo "    - Frontend: http://localhost:3001"
echo "    - Backend:  http://localhost:8082"
echo "    - Database: localhost:5434"
echo ""
info "Comandos úteis:"
echo "  sudo systemctl start secured-guard-multi-env    # Iniciar serviços"
echo "  sudo systemctl stop secured-guard-multi-env     # Parar serviços"
echo "  sudo systemctl restart secured-guard-multi-env  # Reiniciar serviços"
echo "  sudo systemctl status secured-guard-multi-env   # Status do serviço"
echo ""
echo "  ./deploy/manage-multi-env.sh status             # Status dos containers"
echo "  ./deploy/manage-multi-env.sh logs prod backend  # Logs do backend prod"
echo "  ./deploy/manage-multi-env.sh health             # Health check"
echo "  ./deploy/manage-multi-env.sh backup             # Backup dos bancos"
echo ""
log "Os serviços estão configurados para iniciar automaticamente no boot!"
