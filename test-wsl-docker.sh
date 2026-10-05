#!/bin/bash
# Script para testar o sistema no WSL com Docker

set -e  # Para na primeira erro

echo "🚀 Iniciando teste do sistema no WSL..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose não está instalado${NC}"
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.ci.yml" ]; then
    echo -e "${RED}❌ Arquivo docker-compose.ci.yml não encontrado${NC}"
    echo "Execute este script na raiz do projeto"
    exit 1
fi

echo -e "${YELLOW}🔗 Criando redes Docker...${NC}"
docker network create fluxbus-ci-network 2>/dev/null || true
docker network create z7network 2>/dev/null || true

echo -e "${YELLOW}📦 Parando containers existentes...${NC}"
docker-compose -f docker-compose.ci.yml down

echo -e "${YELLOW}🗑️  Removendo volumes antigos (opcional - comente se quiser manter dados)...${NC}"
# Descomente a linha abaixo se quiser limpar o banco completamente
# docker-compose -f docker-compose.ci.yml down -v

echo -e "${GREEN}🔨 Construindo e iniciando containers...${NC}"
docker-compose -f docker-compose.ci.yml up -d

echo -e "${YELLOW}⏳ Aguardando containers iniciarem...${NC}"
sleep 10

echo -e "${YELLOW}📊 Verificando status dos containers...${NC}"
docker-compose -f docker-compose.ci.yml ps

echo -e "${YELLOW}📋 Verificando logs do backend (últimas 50 linhas)...${NC}"
docker logs --tail 50 fluxbus-backend-ci

echo -e "${YELLOW}🔍 Verificando health check do backend...${NC}"
sleep 5
if curl -f http://localhost:8081/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend está respondendo!${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo ainda${NC}"
    echo "Verifique os logs: docker logs -f fluxbus-backend-ci"
fi

echo -e "${YELLOW}📊 Verificando migrations executadas no banco...${NC}"
docker exec fluxbus-db-ci psql -U fluxbus_ci -d fluxbus_ci -c "SELECT COUNT(*) as total_migrations, MAX(version) as ultima_migration FROM flyway_schema_history;" 2>/dev/null || echo "Aguardando banco estar pronto..."

echo -e "${GREEN}✅ Teste concluído!${NC}"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs do backend: docker logs -f fluxbus-backend-ci"
echo "  - Ver logs do banco: docker logs -f fluxbus-db-ci"
echo "  - Verificar migrations: docker exec -it fluxbus-db-ci psql -U fluxbus_ci -d fluxbus_ci -c \"SELECT version, description FROM flyway_schema_history ORDER BY installed_rank;\""
echo "  - Parar containers: docker-compose -f docker-compose.ci.yml down"
echo "  - Ver status: docker-compose -f docker-compose.ci.yml ps"
