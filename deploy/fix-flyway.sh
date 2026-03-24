#!/bin/bash

echo "🔧 Resolvendo problemas do Flyway..."
echo "===================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para resolver Flyway
fix_flyway() {
    local env=$1
    local compose_file=$2
    local backend_container=$3
    
    echo ""
    echo "🔧 Resolvendo Flyway para ambiente: $env"
    
    # Parar apenas o backend
    echo "⏹️ Parando backend $env..."
    docker-compose -f "$compose_file" stop backend
    
    # Aguardar container parar
    sleep 5
    
    # Executar comandos Flyway no container
    echo "🔄 Executando flyway:repair..."
    docker-compose -f "$compose_file" run --rm backend bash -c "
        cd /app && 
        ./mvnw flyway:repair -Dflyway.url=jdbc:postgresql://postgres:5432/secured_guard_${env,,} -Dflyway.user=postgressg -Dflyway.password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' -Dflyway.schemas=public
    "
    
    echo "🔄 Executando flyway:migrate com outOfOrder..."
    docker-compose -f "$compose_file" run --rm backend bash -c "
        cd /app && 
        ./mvnw flyway:migrate -Dflyway.outOfOrder=true -Dflyway.url=jdbc:postgresql://postgres:5432/secured_guard_${env,,} -Dflyway.user=postgressg -Dflyway.password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' -Dflyway.schemas=public
    "
    
    # Reiniciar backend
    echo "🚀 Reiniciando backend $env..."
    docker-compose -f "$compose_file" up -d backend
    
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
        echo -e "${RED}❌ Backend $env ainda não está respondendo${NC}"
        echo "📋 Logs do backend:"
        docker logs --tail 20 "$backend_container" 2>/dev/null || echo "Não foi possível acessar logs"
    fi
}

# Resolver Flyway para cada ambiente
fix_flyway "PROD" "deploy/docker-compose.prod.yml" "secured-guard-backend-prod"

echo ""
echo "🎉 Correção do Flyway concluída!"
echo "==============================="
