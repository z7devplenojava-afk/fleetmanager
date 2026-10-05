#!/bin/bash

echo "🔍 Verificando todos os ambientes..."
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar ambiente
check_environment() {
    local env=$1
    local port=$2
    local container_prefix=$3
    
    echo ""
    echo "📋 Verificando ambiente: $env"
    echo "Porta: $port"
    echo "Container: $container_prefix"
    
    # Verificar se container está rodando
    if docker ps | grep -q "$container_prefix"; then
        echo -e "${GREEN}✅ Container $container_prefix está rodando${NC}"
        
        # Verificar se porta está respondendo
        if curl -s -f "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend respondendo na porta $port${NC}"
        else
            echo -e "${RED}❌ Backend não responde na porta $port${NC}"
            
            # Verificar logs do container
            echo "📋 Últimas linhas do log:"
            docker logs --tail 10 "$container_prefix" 2>/dev/null || echo "Não foi possível acessar logs"
        fi
    else
        echo -e "${RED}❌ Container $container_prefix não está rodando${NC}"
    fi
}

# Verificar cada ambiente
check_environment "DEV" "8081" "fluxbus-backend-dev"
check_environment "PROD" "8080" "fluxbus-backend-prod"
check_environment "CI" "8082" "fluxbus-backend-ci"

echo ""
echo "🔧 Comandos para corrigir:"
echo "=========================="
echo "1. Parar todos os ambientes:"
echo "   docker-compose -f deploy/docker-compose.dev.yml down"
echo "   docker-compose -f deploy/docker-compose.prod.yml down"
echo "   docker-compose -f deploy/docker-compose.ci.yml down"
echo ""
echo "2. Limpar containers e volumes:"
echo "   docker system prune -f"
echo "   docker volume prune -f"
echo ""
echo "3. Recriar ambiente DEV:"
echo "   docker-compose -f deploy/docker-compose.dev.yml up -d --build"
echo ""
echo "4. Recriar ambiente PROD:"
echo "   docker-compose -f deploy/docker-compose.prod.yml up -d --build"
echo ""
echo "5. Verificar logs:"
echo "   docker logs fluxbus-backend-dev"
echo "   docker logs fluxbus-backend-prod"
