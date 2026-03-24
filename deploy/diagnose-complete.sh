#!/bin/bash

echo "🔍 Diagnóstico Completo dos Ambientes"
echo "====================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar container
check_container() {
    local container_name=$1
    local port=$2
    local env_name=$3
    
    echo ""
    echo "📋 Verificando: $env_name ($container_name)"
    echo "Porta: $port"
    
    # Verificar se container existe
    if docker ps -a | grep -q "$container_name"; then
        # Verificar status
        local status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | awk '{print $2}')
        
        if [ -n "$status" ]; then
            echo -e "Status: ${BLUE}$status${NC}"
            
            # Verificar se está saudável
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | grep -q "healthy"; then
                echo -e "${GREEN}✅ Container saudável${NC}"
            elif docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | grep -q "starting"; then
                echo -e "${YELLOW}⚠️ Container iniciando...${NC}"
            else
                echo -e "${RED}❌ Container com problemas${NC}"
            fi
            
            # Testar conectividade
            if curl -s -f "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Backend respondendo na porta $port${NC}"
            else
                echo -e "${RED}❌ Backend não responde na porta $port${NC}"
            fi
            
        else
            echo -e "${RED}❌ Container não está rodando${NC}"
        fi
        
        # Mostrar últimas linhas do log
        echo "📋 Últimas linhas do log:"
        docker logs --tail 5 "$container_name" 2>/dev/null | sed 's/^/  /'
        
    else
        echo -e "${RED}❌ Container não existe${NC}"
    fi
}

# Verificar cada ambiente
check_container "secured-guard-backend-dev" "8081" "DEV"
check_container "secured-guard-backend-prod" "8080" "PROD"
check_container "secured-guard-backend-ci" "8082" "CI"

echo ""
echo "🔧 Comandos para Corrigir:"
echo "=========================="
echo ""
echo "1. Parar todos os ambientes:"
echo "   cd /opt/secured-guard"
echo "   docker-compose -f deploy/docker-compose.dev.yml down"
echo "   docker-compose -f deploy/docker-compose.prod.yml down"
echo "   docker-compose -f deploy/docker-compose.ci.yml down"
echo ""
echo "2. Limpar sistema Docker:"
echo "   docker system prune -f"
echo "   docker volume prune -f"
echo ""
echo "3. Executar script de correção:"
echo "   chmod +x deploy/fix-all-environments.sh"
echo "   ./deploy/fix-all-environments.sh"
echo ""
echo "4. Se houver problemas com Flyway:"
echo "   chmod +x deploy/fix-flyway.sh"
echo "   ./deploy/fix-flyway.sh"
echo ""
echo "5. Verificar logs específicos:"
echo "   docker logs secured-guard-backend-dev"
echo "   docker logs secured-guard-backend-prod"
echo "   docker logs secured-guard-backend-ci"
