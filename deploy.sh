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

log "🚀 Iniciando script de deploy na VPS..."

# ========================================
# 0. PREPARAR VARIÁVEIS (.env RAIZ)
# ========================================
log "0. Verificando arquivo .env na raiz do projeto..."
gen_pass() { # $1 = token fixo a inserir (prod/dev/ci)
  # 24 rand base64 sem quebras + token no meio
  local rand; rand=$(openssl rand -base64 18 | tr -d '\n')
  echo "${rand:0:8}$1${rand:8}"
}

ensure_kv() { # $1 key, $2 value
  if grep -q "^$1=" ./.env 2>/dev/null; then
    :
  else
    echo "$1=$2" >> ./.env
  fi
}

if [ ! -f ./.env ]; then
  warn "Arquivo .env não encontrado. Gerando automaticamente..."
  : > ./.env
fi

# Chaves obrigatórias com defaults e senhas geradas contendo tokens
ensure_kv POSTGRES_DB fluxbus_prod
ensure_kv POSTGRES_USER postgressg
ensure_kv POSTGRES_PASSWORD "$(gen_pass SGprod@2025)"

ensure_kv POSTGRES_DB_DEV fluxbus_dev
ensure_kv POSTGRES_USER_DEV postgressg
ensure_kv POSTGRES_PASSWORD_DEV "$(gen_pass SGdev@2025no)"

ensure_kv POSTGRES_DB_CI fluxbus_ci
ensure_kv POSTGRES_USER_CI postgressg
ensure_kv POSTGRES_PASSWORD_CI "$(gen_pass SGci@2025)"

ensure_kv REDIS_PASSWORD "$(openssl rand -base64 24 | tr -d '\n')"

log "✅ .env preparado. Conteúdo (sem senhas):"
grep -E '^(POSTGRES_DB(_DEV|_CI)?|POSTGRES_USER(_DEV|_CI)?|REDIS_PASSWORD)=' ./.env | sed 's/POSTGRES_PASSWORD.*/POSTGRES_PASSWORD=********/g' | sed 's/REDIS_PASSWORD=.*/REDIS_PASSWORD=********/g'

# ========================================
# 1. ATUALIZAR CÓDIGO
# ========================================
log "1. Atualizando código do repositório..."
git pull origin main
log "✅ Código atualizado com sucesso!"

# ========================================
# 2. BUILD BACKEND
# ========================================
log "2. Fazendo build do backend..."
cd backend
mvn clean compile
mvn package -DskipTests
log "✅ Backend compilado com sucesso!"

# ========================================
# 3. BUILD FRONTEND
# ========================================
log "3. Fazendo build do frontend..."
cd ../frontend

# Verificar se é Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    warn "⚠️ Sistema não é Ubuntu, mas continuando..."
fi

# Verificar versão do Node.js
log "🔍 Verificando versão do Node.js..."
node --version
npm --version

# Verificar se Node.js é compatível (versão 14+)
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    error "Node.js versão $NODE_VERSION é muito antiga. Necessário Node.js 14+ para Vite."
fi

# Limpar dependências antigas (Windows) e reinstalar para Linux
log "🧹 Limpando dependências antigas..."
rm -rf node_modules
rm -f package-lock.json

# Instalar dependências para Linux
log "📦 Instalando dependências para Linux..."
npm install

# Verificar se Vite está instalado
log "🔍 Verificando Vite..."
npx vite --version

# Fazer build
log "🔨 Fazendo build do frontend..."
npm run build

log "✅ Frontend compilado com sucesso!"

# ========================================
# 4. BANCO (PRODUÇÃO): SUBIR POSTGRES, CRIAR DB E AJUSTAR SENHA
# ========================================
log "4. Subindo Postgres (produção) e garantindo banco/usuário..."
cd .. # Voltar raiz do projeto
set -a; source ./.env; set +a
docker compose --env-file ./.env -f deploy/docker-compose.prod.yml up -d postgres
sleep 3
docker compose --env-file ./.env -f deploy/docker-compose.prod.yml exec postgres sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}'\" | grep -q 1 || psql -U postgres -c \"CREATE USER ${POSTGRES_USER} WITH SUPERUSER PASSWORD '${POSTGRES_PASSWORD}';\""
docker compose --env-file ./.env -f deploy/docker-compose.prod.yml exec postgres sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'\" | grep -q 1 || psql -U postgres -c \"CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};\""
docker compose --env-file ./.env -f deploy/docker-compose.prod.yml exec postgres bash -lc "set +H; psql -U postgres -v pw='${POSTGRES_PASSWORD}' -c \"ALTER USER ${POSTGRES_USER} WITH PASSWORD :'pw';\"" || warn "Não foi possível alterar senha do usuário agora. Verifique volume existente."

# ========================================
# 5. BACKEND (PRODUÇÃO): SUBIR E DEIXAR FLYWAY RODAR
# ========================================
log "5. Subindo backend (produção) para executar migrações Flyway..."
docker compose --env-file ./.env -f deploy/docker-compose.prod.yml up -d backend
sleep 5
docker compose -f deploy/docker-compose.prod.yml logs --since=2m backend | grep -i flyway || true

# ========================================
# 6. RESTART FRONTEND/REDIS/NGINX (PRODUÇÃO)
# ========================================
log "6. Reiniciando demais serviços Docker (produção)..."
docker compose --env-file ./.env -f deploy/docker-compose.prod.yml up -d --build redis frontend nginx
log "✅ Serviços Docker (produção) atualizados!"

# ========================================
# 7. AMBIENTE DE DESENVOLVIMENTO (opcional)
# ========================================
if [ -f deploy/docker-compose.dev.yml ]; then
  log "7. Subindo Postgres (dev) e garantindo banco/usuário..."
  docker compose --env-file ./.env -f deploy/docker-compose.dev.yml up -d postgres
  sleep 3
  docker compose --env-file ./.env -f deploy/docker-compose.dev.yml exec postgres sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER_DEV}'\" | grep -q 1 || psql -U postgres -c \"CREATE USER ${POSTGRES_USER_DEV} WITH SUPERUSER PASSWORD '${POSTGRES_PASSWORD_DEV}';\""
  docker compose --env-file ./.env -f deploy/docker-compose.dev.yml exec postgres sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB_DEV}'\" | grep -q 1 || psql -U postgres -c \"CREATE DATABASE ${POSTGRES_DB_DEV} OWNER ${POSTGRES_USER_DEV};\""
  docker compose --env-file ./.env -f deploy/docker-compose.dev.yml exec postgres bash -lc "set +H; psql -U postgres -v pw='${POSTGRES_PASSWORD_DEV}' -c \"ALTER USER ${POSTGRES_USER_DEV} WITH PASSWORD :'pw';\"" || warn "Não foi possível alterar senha do usuário dev agora."

  log "7.1 Subindo backend (dev) para executar migrações Flyway..."
  docker compose --env-file ./.env -f deploy/docker-compose.dev.yml up -d backend
  sleep 5
  docker compose -f deploy/docker-compose.dev.yml logs --since=2m backend | grep -i flyway || true
else
  warn "Compose de desenvolvimento não encontrado (deploy/docker-compose.dev.yml). Pulando dev."
fi

# ========================================
# 8. AMBIENTE DE CI (opcional)
# ========================================
if [ -f deploy/docker-compose.ci.yml ]; then
  log "8. Subindo Postgres (ci) e garantindo banco/usuário..."
  docker compose --env-file ./.env -f deploy/docker-compose.ci.yml up -d postgres
  sleep 3
  docker compose --env-file ./.env -f deploy/docker-compose.ci.yml exec postgres sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER_CI}'\" | grep -q 1 || psql -U postgres -c \"CREATE USER ${POSTGRES_USER_CI} WITH SUPERUSER PASSWORD '${POSTGRES_PASSWORD_CI}';\""
  docker compose --env-file ./.env -f deploy/docker-compose.ci.yml exec postgres sh -c "psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB_CI}'\" | grep -q 1 || psql -U postgres -c \"CREATE DATABASE ${POSTGRES_DB_CI} OWNER ${POSTGRES_USER_CI};\""
  docker compose --env-file ./.env -f deploy/docker-compose.ci.yml exec postgres bash -lc "set +H; psql -U postgres -v pw='${POSTGRES_PASSWORD_CI}' -c \"ALTER USER ${POSTGRES_USER_CI} WITH PASSWORD :'pw';\"" || warn "Não foi possível alterar senha do usuário ci agora."

  log "8.1 Subindo backend (ci) para executar migrações Flyway..."
  docker compose --env-file ./.env -f deploy/docker-compose.ci.yml up -d backend
  sleep 5
  docker compose -f deploy/docker-compose.ci.yml logs --since=2m backend | grep -i flyway || true
else
  warn "Compose de CI não encontrado (deploy/docker-compose.ci.yml). Pulando ci."
fi

# ========================================
# 9. VERIFICAR STATUS
# ========================================
log "9. Verificando status dos serviços..."
docker compose -f deploy/docker-compose.prod.yml ps
if [ -f deploy/docker-compose.dev.yml ]; then docker compose -f deploy/docker-compose.dev.yml ps; fi
if [ -f deploy/docker-compose.ci.yml ]; then docker compose -f deploy/docker-compose.ci.yml ps; fi

log "🎉 Deploy concluído com sucesso!"
