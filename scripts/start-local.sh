#!/bin/bash

# ============================================
# SECURED GUARD - Ambiente Local (Bash)
# Inicia TODO o sistema dockerizado
# ============================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🏠 SECURED GUARD - Ambiente Local${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo "Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi

echo -e "${GREEN}✅ Docker está rodando${NC}"
echo ""

# Verificar se env.local.template existe e copiar se necessário
if [ ! -f .env.local ]; then
    if [ -f env.local.template ]; then
        echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado${NC}"
        echo "Copiando de env.local.template..."
        cp env.local.template .env.local
        echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
        echo ""
    fi
fi

# Parar containers existentes
echo -e "${YELLOW}🛑 Parando containers existentes...${NC}"
docker-compose -f docker-compose.local.yml down 2>/dev/null || true
echo ""

# Construir imagens
echo -e "${YELLOW}🔨 Construindo imagens Docker...${NC}"
docker-compose -f docker-compose.local.yml build
echo ""

# Iniciar serviços
echo -e "${YELLOW}🚀 Iniciando serviços...${NC}"
docker-compose -f docker-compose.local.yml up -d
echo ""

# Aguardar serviços ficarem prontos
echo -e "${YELLOW}⏳ Aguardando serviços iniciarem...${NC}"
sleep 10

# Verificar status
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 Status dos Serviços:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar PostgreSQL
if docker exec secured-guard-local-db pg_isready -U dev_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL:${NC} secured-guard-local-db (porta 5432)"
else
    echo -e "${YELLOW}⏳ PostgreSQL:${NC} Iniciando..."
fi

# Verificar Redis
if docker exec secured-guard-local-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis:${NC} secured-guard-local-redis (porta 6379)"
else
    echo -e "${YELLOW}⏳ Redis:${NC} Iniciando..."
fi

# Verificar MinIO
if curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO:${NC} secured-guard-local-minio (portas 9000, 9001)"
else
    echo -e "${YELLOW}⏳ MinIO:${NC} Iniciando..."
fi

# Verificar WhatsApp
if curl -sf http://localhost:3333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ WhatsApp:${NC} secured-guard-local-whatsapp (porta 3333)"
else
    echo -e "${YELLOW}⏳ WhatsApp:${NC} Iniciando..."
fi

# Verificar Backend
sleep 20
if curl -sf http://localhost:8083/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend:${NC} secured-guard-local-backend (porta 8083)"
else
    echo -e "${YELLOW}⏳ Backend:${NC} Iniciando (pode demorar ~60s)..."
fi

# Verificar Frontend
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend:${NC} secured-guard-local-frontend (porta 3000)"
else
    echo -e "${YELLOW}⏳ Frontend:${NC} Iniciando..."
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Ambiente Local Iniciado!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌐 URLs de Acesso:${NC}"
echo ""
echo -e "  Frontend:      ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend API:   ${BLUE}http://localhost:8083${NC}"
echo -e "  Swagger UI:    ${BLUE}http://localhost:8083/swagger-ui.html${NC}"
echo -e "  MinIO Console: ${BLUE}http://localhost:9001${NC}"
echo -e "                 (minioadmin/minioadmin)"
echo -e "  WhatsApp API:  ${BLUE}http://localhost:3333/health${NC}"
echo ""
echo -e "${GREEN}💾 Banco de Dados:${NC}"
echo ""
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  Database: secured_guard_local"
echo "  User:     dev_user"
echo "  Password: dev_pass"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Comandos Úteis:${NC}"
echo ""
echo "  Ver logs:       docker-compose -f docker-compose.local.yml logs -f"
echo "  Parar:          docker-compose -f docker-compose.local.yml down"
echo "  Reiniciar:      docker-compose -f docker-compose.local.yml restart"
echo "  Status:         docker-compose -f docker-compose.local.yml ps"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Abrir browser (opcional)
read -p "Abrir browser automaticamente? (s/n): " open_browser
if [ "$open_browser" = "s" ]; then
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open > /dev/null; then
        open http://localhost:3000
    elif command -v wslview > /dev/null; then
        wslview http://localhost:3000
    fi
fi





























