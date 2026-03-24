#!/bin/bash

echo "🔧 Corrigindo Flyway - Reconstrução Completa"
echo "============================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ir para diretório do projeto
cd /opt/secured-guard

echo "📁 Diretório atual: $(pwd)"

# Parar ambiente PROD
echo ""
echo "⏹️ Parando ambiente PROD..."
docker-compose -f deploy/docker-compose.prod.yml down

# Limpar containers e volumes
echo ""
echo "🧹 Limpando containers e volumes..."
docker container prune -f
docker volume prune -f

# Remover volumes específicos do PROD
echo ""
echo "🗑️ Removendo volumes específicos do PROD..."
docker volume rm deploy_postgres_data_prod 2>/dev/null || echo "Volume postgres_data_prod não existe"
docker volume rm deploy_backend_logs_prod 2>/dev/null || echo "Volume backend_logs_prod não existe"
docker volume rm deploy_backend_uploads_prod 2>/dev/null || echo "Volume backend_uploads_prod não existe"

# Configurar .env para PROD
echo ""
echo "📋 Configurando .env para PROD..."
cp deploy/env.prod .env

# Subir apenas o banco primeiro
echo ""
echo "🚀 Subindo banco de dados PROD..."
docker-compose -f deploy/docker-compose.prod.yml up -d postgres

# Aguardar banco ficar pronto
echo "⏳ Aguardando banco ficar pronto..."
sleep 15

# Verificar se banco está rodando
if docker ps | grep -q "secured-guard-db-prod"; then
    echo -e "${GREEN}✅ Banco PROD rodando${NC}"
else
    echo -e "${RED}❌ Banco PROD não está rodando${NC}"
    exit 1
fi

# Executar migrações Flyway localmente
echo ""
echo "🔄 Executando migrações Flyway localmente..."

# Verificar se Maven está disponível
if command -v mvn &> /dev/null; then
    echo "📋 Maven encontrado, executando migrações..."
    
    # Executar flyway:repair
    mvn -f backend/pom.xml flyway:repair \
        -Dflyway.url=jdbc:postgresql://localhost:5432/secured_guard_prod \
        -Dflyway.user=postgressg \
        -Dflyway.password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
        -Dflyway.schemas=public
    
    # Executar flyway:migrate com outOfOrder
    mvn -f backend/pom.xml flyway:migrate \
        -Dflyway.outOfOrder=true \
        -Dflyway.url=jdbc:postgresql://localhost:5432/secured_guard_prod \
        -Dflyway.user=postgressg \
        -Dflyway.password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
        -Dflyway.schemas=public
    
    echo -e "${GREEN}✅ Migrações Flyway executadas${NC}"
else
    echo -e "${YELLOW}⚠️ Maven não encontrado, pulando migrações${NC}"
fi

# Subir todos os serviços PROD
echo ""
echo "🚀 Subindo todos os serviços PROD..."
docker-compose -f deploy/docker-compose.prod.yml up -d --build

# Aguardar backend ficar pronto
echo "⏳ Aguardando backend PROD ficar pronto..."
sleep 30

# Verificar se backend está respondendo
if curl -s -f "http://localhost:8080/actuator/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend PROD respondendo na porta 8080${NC}"
else
    echo -e "${RED}❌ Backend PROD ainda não está respondendo${NC}"
    echo "📋 Logs do backend PROD:"
    docker logs --tail 20 secured-guard-backend-prod
fi

echo ""
echo "🎉 Correção do Flyway concluída!"
echo "==============================="
echo ""
echo "📋 Status Final:"
echo "PROD: http://localhost:8080"
echo ""
echo "🔍 Para verificar:"
echo "docker ps"
echo "curl http://localhost:8080/actuator/health"
