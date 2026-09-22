#!/bin/bash

# ========================================
# SCRIPT DE CONFIGURAÇÃO WSL
# Para ambiente de desenvolvimento no WSL
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

log "🐧 Configurando ambiente WSL para FluxBus..."

# Verificar se estamos no WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    warning "Este script é otimizado para WSL. Continuando mesmo assim..."
fi

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    error "Execute este script na raiz do projeto FluxBus"
fi

# ========================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ========================================
log "1. Verificando pré-requisitos..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker não encontrado. Instale o Docker Desktop no Windows"
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não encontrado"
fi

# Verificar se Docker está rodando
if ! docker info &> /dev/null; then
    error "Docker não está rodando. Inicie o Docker Desktop no Windows"
fi

log "✅ Pré-requisitos OK!"

# ========================================
# 2. CRIAR REDE DOCKER COMPARTILHADA
# ========================================
log "2. Criando rede Docker compartilhada 'fluxbus' (se não existir)..."

if ! docker network ls --format '{{.Name}}' | grep -q '^fluxbus$'; then
    docker network create --driver bridge fluxbus || error "Falha ao criar a rede Docker 'fluxbus'"
    log "Rede 'fluxbus' criada."
else
    log "Rede 'fluxbus' já existe."
fi

# ========================================
# 3. CONFIGURAR ARQUIVO .env PARA WSL
# ========================================
log "3. Configurando arquivo .env para WSL..."

# Criar .env.wsl se não existir
if [ ! -f ".env.wsl" ]; then
    log "📝 Criando arquivo .env.wsl..."
    
    # Gerar senhas seguras
    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')
    REDIS_PASSWORD=$(openssl rand -base64 16 | tr -d '\n')
    JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
    
    cat > .env.wsl << EOF
# ===================== CONFIGURAÇÃO WSL =====================
ENVIRONMENT=development
SPRING_PROFILES_ACTIVE=dev

# ===================== BANCO DE DADOS =====================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fluxbus_dev
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# ===================== REDIS CACHE =====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# ===================== JWT CONFIGURATION =====================
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=604800000
JWT_REFRESH_EXPIRATION=604800000

# ===================== SERVER CONFIGURATION =====================
SERVER_PORT=8081
SERVER_ADDRESS=0.0.0.0

# ===================== LOGGING CONFIGURATION =====================
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=DEBUG

# ===================== FLYWAY CONFIGURATION =====================
FLYWAY_ENABLED=true
FLYWAY_CLEAN_DISABLED=false
FLYWAY_OUT_OF_ORDER=true
FLYWAY_VALIDATE_ON_MIGRATE=true

# ===================== DEVELOPMENT SPECIFIC =====================
DEV_SHOW_SQL=true
DEV_FORMAT_SQL=true
DEV_HIBERNATE_DDL_AUTO=update
EOF
    
    log "✅ Arquivo .env.wsl criado com senhas seguras"
else
    log "✅ Arquivo .env.wsl já existe"
fi

# ========================================
# 4. CONFIGURAR DOCKER COMPOSE PARA WSL
# ========================================
log "4. Configurando Docker Compose para WSL..."

# Parar containers existentes
log "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Limpar volumes antigos se necessário
if [ "$1" = "--clean" ]; then
    log "🧹 Limpando volumes antigos..."
    docker-compose down -v
    docker system prune -f
fi

# ========================================
# 5. SUBIR SERVIÇOS
# ========================================
log "5. Subindo serviços no WSL..."

# Usar arquivo .env.wsl
export $(cat .env.wsl | grep -v '^#' | xargs)

# Subir serviços
docker-compose --env-file .env.wsl up -d --build

# Aguardar serviços ficarem prontos
log "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# ========================================
# 6. VERIFICAR STATUS
# ========================================
log "6. Verificando status dos serviços..."

# Verificar PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres &>/dev/null; then
    log "✅ PostgreSQL está rodando"
else
    warning "⚠️ PostgreSQL pode não estar pronto ainda"
fi

# Verificar Redis
if docker-compose exec -T redis redis-cli ping &>/dev/null; then
    log "✅ Redis está rodando"
else
    warning "⚠️ Redis pode não estar pronto ainda"
fi

# Verificar Backend
sleep 5
if curl -s -f "http://localhost:8080/actuator/health" &>/dev/null; then
    log "✅ Backend está rodando"
else
    warning "⚠️ Backend pode não estar pronto ainda"
fi

# Verificar Frontend
if curl -s -f "http://localhost:5173" &>/dev/null; then
    log "✅ Frontend está rodando"
else
    warning "⚠️ Frontend pode não estar pronto ainda"
fi

# ========================================
# 7. EXECUTAR MIGRAÇÕES
# ========================================
log "7. Executando migrações do banco..."

# Aguardar backend ficar totalmente pronto
sleep 15

# Verificar se Flyway executou as migrações
if docker-compose logs backend | grep -i "flyway" | grep -i "success" &>/dev/null; then
    log "✅ Migrações executadas com sucesso"
else
    warning "⚠️ Verifique se as migrações foram executadas corretamente"
fi

# ========================================
# 8. MOSTRAR STATUS FINAL
# ========================================
log "📊 Status dos serviços:"
docker-compose ps

echo ""
log "🎉 Ambiente WSL configurado com sucesso!"
echo ""
info "🌐 Acesse sua aplicação:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo "   Database: localhost:5432"
echo "   Redis:    localhost:6379"
echo ""
info "📚 Comandos úteis:"
echo "   Ver logs:     docker-compose logs -f"
echo "   Parar:        docker-compose down"
echo "   Reiniciar:    docker-compose restart"
echo "   Status:       docker-compose ps"
echo "   Limpar tudo:  docker-compose down -v && docker system prune -f"
echo ""
info "🔧 Para desenvolvimento:"
echo "   Backend:  cd backend && ./mvnw spring-boot:run"
echo "   Frontend: cd frontend && npm run dev"
echo ""
warning "💡 Dica: Use Ctrl+C para parar os logs em tempo real"
