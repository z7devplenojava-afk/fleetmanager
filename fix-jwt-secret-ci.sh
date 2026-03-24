#!/bin/bash

# Script para corrigir a chave JWT no ambiente CI
# Execute este script na VPS

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

log "🔧 Corrigindo chave JWT no ambiente CI..."

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.ci.yml" ] && [ ! -f "deploy/docker-compose.ci.yml" ]; then
    error "Execute este script no diretório raiz do projeto (onde está docker-compose.ci.yml)"
fi

# Determinar o caminho do docker-compose
if [ -f "docker-compose.ci.yml" ]; then
    COMPOSE_FILE="docker-compose.ci.yml"
elif [ -f "deploy/docker-compose.ci.yml" ]; then
    COMPOSE_FILE="deploy/docker-compose.ci.yml"
fi

log "Usando arquivo: $COMPOSE_FILE"

# 1. Criar/atualizar arquivo .env na raiz
log "1. Criando/atualizando arquivo .env..."
cat > .env << 'EOF'
JWT_SECRET=jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure
POSTGRES_PASSWORD_CI=4KaCiJc6an@7sgbdcid2025
REDIS_PASSWORD=redis_ci_2025
EOF

log "✅ Arquivo .env criado/atualizado"

# 2. Verificar tamanho da chave
JWT_SECRET_LEN=$(echo -n "jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure" | wc -c)
if [ "$JWT_SECRET_LEN" -lt 64 ]; then
    error "Chave JWT ainda está muito curta: $JWT_SECRET_LEN caracteres (mínimo 64)"
else
    log "✅ Chave JWT tem $JWT_SECRET_LEN caracteres (OK)"
fi

# 3. Exportar variável no shell atual
export JWT_SECRET="jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure"
log "✅ Variável JWT_SECRET exportada no shell"

# 4. Parar o container atual
log "2. Parando container backend-ci..."
docker-compose -f "$COMPOSE_FILE" stop backend-ci 2>/dev/null || warn "Container já estava parado"

# 5. Remover o container (importante para recriar com novas variáveis)
log "3. Removendo container backend-ci..."
docker-compose -f "$COMPOSE_FILE" rm -f backend-ci 2>/dev/null || warn "Container não existia"

# 6. Recriar o container com as novas variáveis
log "4. Recriando container backend-ci com nova chave JWT..."
docker-compose -f "$COMPOSE_FILE" up -d backend-ci

# 7. Aguardar o container iniciar
log "5. Aguardando container iniciar (30 segundos)..."
sleep 30

# 8. Verificar se a variável está correta dentro do container
log "6. Verificando variável JWT_SECRET dentro do container..."
CONTAINER_JWT=$(docker exec secured-guard-backend-ci env | grep JWT_SECRET | cut -d= -f2)
CONTAINER_JWT_LEN=$(echo -n "$CONTAINER_JWT" | wc -c)

if [ "$CONTAINER_JWT_LEN" -lt 64 ]; then
    error "❌ Chave JWT no container ainda está curta: $CONTAINER_JWT_LEN caracteres"
    warn "Valor atual: $CONTAINER_JWT"
else
    log "✅ Chave JWT no container está correta: $CONTAINER_JWT_LEN caracteres"
fi

# 9. Verificar logs do backend
log "7. Verificando logs do backend (últimas 20 linhas)..."
docker-compose -f "$COMPOSE_FILE" logs --tail=20 backend-ci | grep -i -E "(jwt|error|exception)" || true

# 10. Testar health check
log "8. Testando health check..."
sleep 10
if curl -s -f http://localhost:8081/api/health > /dev/null 2>&1; then
    log "✅ Backend está respondendo"
else
    warn "⚠️ Backend ainda não está respondendo. Verifique os logs com: docker-compose -f $COMPOSE_FILE logs backend-ci"
fi

log "🎉 Processo concluído!"
log ""
log "Próximos passos:"
log "1. Teste o login: curl -X POST https://ci.z7botsolutions.com.br/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"jose.ramos\",\"password\":\"Admin1234\"}'"
log "2. Se ainda houver erro, verifique os logs: docker-compose -f $COMPOSE_FILE logs -f backend-ci"

