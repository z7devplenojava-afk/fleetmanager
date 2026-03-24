#!/bin/bash
# Script Bash para iniciar serviços locais do Secured Guard
# Uso: ./start-local-services.sh

echo "🚀 Iniciando serviços locais do Secured Guard..."
echo ""

# Verificar se Docker está rodando
echo "🔍 Verificando Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker não está rodando! Por favor, inicie o Docker."
    exit 1
fi
echo "✅ Docker está rodando"

# Verificar se docker-compose está disponível
echo "🔍 Verificando Docker Compose..."
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose não está disponível!"
    exit 1
fi
echo "✅ Docker Compose está disponível"

echo ""
echo "📦 Iniciando serviços (PostgreSQL, Redis, MinIO, WhatsApp)..."
docker-compose -f docker-compose.local.yml up -d postgres redis minio whatsapp

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

echo ""
echo "📊 Status dos serviços:"
docker-compose -f docker-compose.local.yml ps

echo ""
echo "🔍 Verificando saúde dos serviços..."

# Verificar PostgreSQL
echo -n "  PostgreSQL... "
if docker exec secured-guard-local-db pg_isready -U dev_user > /dev/null 2>&1; then
    echo "✅"
else
    echo "⚠️  Ainda inicializando..."
fi

# Verificar Redis
echo -n "  Redis... "
if docker exec secured-guard-local-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅"
else
    echo "⚠️  Ainda inicializando..."
fi

echo ""
echo "✅ Serviços iniciados!"
echo ""
echo "📝 Próximos passos:"
echo "  1. Configure o perfil Spring: SPRING_PROFILES_ACTIVE=local"
echo "  2. Inicie o backend pela sua IDE"
echo "  3. O backend vai conectar em:"
echo "     - PostgreSQL: localhost:5432"
echo "     - Redis: localhost:6379"
echo "     - MinIO: localhost:9000"
echo "     - WhatsApp: localhost:3333"
echo ""
echo "💡 Para ver logs: docker-compose -f docker-compose.local.yml logs -f [servico]"
echo "💡 Para parar: docker-compose -f docker-compose.local.yml down"

