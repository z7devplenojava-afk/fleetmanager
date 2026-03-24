#!/bin/bash

echo "🚀 Correção Rápida dos Ambientes"
echo "================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ir para diretório do projeto
cd /opt/secured-guard

echo "📁 Diretório atual: $(pwd)"

# Parar todos os ambientes
echo ""
echo "⏹️ Parando todos os ambientes..."
docker-compose -f deploy/docker-compose.dev.yml down 2>/dev/null || echo "DEV já estava parado"
docker-compose -f deploy/docker-compose.prod.yml down 2>/dev/null || echo "PROD já estava parado"
docker-compose -f deploy/docker-compose.ci.yml down 2>/dev/null || echo "CI já estava parado"

# Limpar containers órfãos
echo ""
echo "🧹 Limpando containers órfãos..."
docker container prune -f
docker volume prune -f

# Verificar se arquivos .env existem
echo ""
echo "📋 Verificando arquivos .env..."
for env in dev prod ci; do
    if [ ! -f "deploy/env.$env" ]; then
        echo -e "${YELLOW}⚠️ Criando deploy/env.$env${NC}"
        cat > "deploy/env.$env" << EOF
# Database
POSTGRES_DB=secured_guard_$env
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx

# Redis
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=mySecretKey123456789012345678901234567890

# Environment
SPRING_PROFILES_ACTIVE=$env
EOF
    else
        echo -e "${GREEN}✅ deploy/env.$env existe${NC}"
    fi
done

# Subir ambiente PROD primeiro (mais estável)
echo ""
echo "🚀 Subindo ambiente PROD..."
cp deploy/env.prod .env
docker-compose -f deploy/docker-compose.prod.yml up -d --build

# Aguardar PROD ficar pronto
echo "⏳ Aguardando PROD ficar pronto..."
sleep 30

# Verificar PROD
if curl -s -f "http://localhost:8080/actuator/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PROD funcionando na porta 8080${NC}"
else
    echo -e "${RED}❌ PROD com problemas${NC}"
    echo "📋 Logs do PROD:"
    docker logs --tail 10 secured-guard-backend-prod
fi

# Subir ambiente DEV
echo ""
echo "🚀 Subindo ambiente DEV..."
cp deploy/env.dev .env
docker-compose -f deploy/docker-compose.dev.yml up -d --build

# Aguardar DEV ficar pronto
echo "⏳ Aguardando DEV ficar pronto..."
sleep 30

# Verificar DEV
if curl -s -f "http://localhost:8081/actuator/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DEV funcionando na porta 8081${NC}"
else
    echo -e "${RED}❌ DEV com problemas${NC}"
    echo "📋 Logs do DEV:"
    docker logs --tail 10 secured-guard-backend-dev
fi

# Subir ambiente CI
echo ""
echo "🚀 Subindo ambiente CI..."
cp deploy/env.ci .env
docker-compose -f deploy/docker-compose.ci.yml up -d --build

# Aguardar CI ficar pronto
echo "⏳ Aguardando CI ficar pronto..."
sleep 30

# Verificar CI
if curl -s -f "http://localhost:8082/actuator/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CI funcionando na porta 8082${NC}"
else
    echo -e "${RED}❌ CI com problemas${NC}"
    echo "📋 Logs do CI:"
    docker logs --tail 10 secured-guard-backend-ci
fi

echo ""
echo "🎉 Correção concluída!"
echo "====================="
echo ""
echo "📋 Status Final:"
echo "PROD: http://localhost:8080"
echo "DEV:  http://localhost:8081"
echo "CI:   http://localhost:8082"
echo ""
echo "🔍 Para verificar containers:"
echo "docker ps"
