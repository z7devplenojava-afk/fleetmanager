#!/bin/bash

# ========================================
# FLUXBUS - Script de Inicialização Desenvolvimento
# ========================================

echo "🚀 Iniciando FluxBus - Ambiente de Desenvolvimento"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo "Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi

echo -e "${GREEN}✅ Docker está rodando${NC}"
echo ""

# Parar containers existentes (se houver)
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.dev.yml down

echo ""
echo "🐳 Iniciando serviços Docker..."
echo "   - PostgreSQL (porta 5432)"
echo "   - Redis (porta 6379)"
echo "   - MinIO (portas 9000, 9001)"
echo "   - WhatsApp Service (porta 3333)"
echo ""

# Iniciar containers
docker-compose -f docker-compose.dev.yml up -d

# Aguardar serviços ficarem prontos
echo ""
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 5

# Verificar status dos serviços
echo ""
echo "📊 Status dos Serviços:"
echo ""

# PostgreSQL
if docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL: Pronto${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL: Aguardando...${NC}"
fi

# Redis
if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis: Pronto${NC}"
else
    echo -e "${YELLOW}⚠️  Redis: Aguardando...${NC}"
fi

# WhatsApp Service
if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ WhatsApp Service: Pronto${NC}"
else
    echo -e "${YELLOW}⚠️  WhatsApp Service: Aguardando...${NC}"
fi

# MinIO
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO: Pronto${NC}"
else
    echo -e "${YELLOW}⚠️  MinIO: Aguardando...${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Serviços Docker iniciados com sucesso!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Iniciar o Backend:"
echo "   cd backend && mvn spring-boot:run"
echo ""
echo "2. Iniciar o Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Acessar o sistema:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:8083"
echo "   📦 MinIO Console: http://localhost:9001"
echo ""
echo "4. Conectar WhatsApp:"
echo "   Acesse: Configurações > Conexão WhatsApp"
echo "   Clique em 'Gerar QR Code' e escaneie"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Comandos úteis:"
echo "   Ver logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Parar: docker-compose -f docker-compose.dev.yml down"
echo "   Status: docker-compose -f docker-compose.dev.yml ps"
echo ""
echo "📚 Documentação completa: DOCKER_COMPOSE_GUIDE.md"
echo ""





























