#!/bin/bash

echo "🔧 Corrigindo todos os ambientes..."
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para corrigir ambiente
fix_environment() {
    local env=$1
    local compose_file=$2
    local backend_container=$3
    
    echo ""
    echo "🔧 Corrigindo ambiente: $env"
    echo "Arquivo: $compose_file"
    
    # Parar ambiente
    echo "⏹️ Parando ambiente $env..."
    docker-compose -f "$compose_file" down
    
    # Limpar containers órfãos
    echo "🧹 Limpando containers órfãos..."
    docker container prune -f
    
    # Verificar se arquivo .env específico existe
    local env_file="deploy/env.${env,,}"
    if [ ! -f "$env_file" ]; then
        echo -e "${YELLOW}⚠️ Arquivo $env_file não encontrado, criando...${NC}"
        cat > "$env_file" << EOF
# Database
POSTGRES_DB=secured_guard_${env,,}
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx

# Redis
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=mySecretKey123456789012345678901234567890

# Environment
SPRING_PROFILES_ACTIVE=${env,,}
EOF
        echo -e "${GREEN}✅ Arquivo $env_file criado${NC}"
    fi
    
    # Copiar arquivo .env específico para .env
    cp "$env_file" .env
    echo -e "${GREEN}✅ Arquivo .env configurado para $env${NC}"
    
    # Subir ambiente
    echo "🚀 Subindo ambiente $env..."
    if docker-compose -f "$compose_file" up -d --build; then
        echo -e "${GREEN}✅ Ambiente $env iniciado com sucesso${NC}"
        
        # Aguardar backend ficar pronto
        echo "⏳ Aguardando backend ficar pronto..."
        sleep 30
        
        # Verificar se backend está respondendo
        local port
        case $env in
            "DEV") port=8081 ;;
            "PROD") port=8080 ;;
            "CI") port=8082 ;;
        esac
        
        if curl -s -f "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend $env respondendo na porta $port${NC}"
        else
            echo -e "${RED}❌ Backend $env não está respondendo${NC}"
            echo "📋 Logs do backend:"
            docker logs --tail 20 "$backend_container" 2>/dev/null || echo "Não foi possível acessar logs"
        fi
    else
        echo -e "${RED}❌ Falha ao iniciar ambiente $env${NC}"
    fi
}

# Corrigir cada ambiente
fix_environment "DEV" "deploy/docker-compose.dev.yml" "secured-guard-backend-dev"
fix_environment "PROD" "deploy/docker-compose.prod.yml" "secured-guard-backend-prod"
fix_environment "CI" "deploy/docker-compose.ci.yml" "secured-guard-backend-ci"

echo ""
echo "🎉 Correção concluída!"
echo "====================="
echo ""
echo "📋 Status dos ambientes:"
echo "DEV:  http://localhost:8081"
echo "PROD: http://localhost:8080"
echo "CI:   http://localhost:8082"
echo ""
echo "🔍 Para verificar logs:"
echo "docker logs secured-guard-backend-dev"
echo "docker logs secured-guard-backend-prod"
echo "docker logs secured-guard-backend-ci"
