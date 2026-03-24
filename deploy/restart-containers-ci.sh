#!/bin/bash

# Script para reiniciar containers no ambiente CI
# Execute na VPS: bash deploy/restart-containers-ci.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🐳 Reiniciando containers do ambiente CI...${NC}"
echo ""

# Navegar para o diretório correto
cd /var/www/secured_guard/ci

# Verificar se o .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "   O arquivo .env deve ser criado pelo workflow do GitHub Actions."
    echo "   Verifique se o deploy foi executado corretamente."
    exit 1
fi

echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
echo ""

# Verificar configurações importantes no .env
echo -e "${YELLOW}📋 Verificando configurações do .env:${NC}"
if grep -q "MAIL_PASSWORD=" .env; then
    echo "   ✅ MAIL_PASSWORD configurado"
else
    echo "   ⚠️  MAIL_PASSWORD não encontrado no .env"
fi

if grep -q "BAILEYS_REST_URL=" .env; then
    BAILEYS_URL=$(grep "BAILEYS_REST_URL=" .env | cut -d'=' -f2)
    echo "   ✅ BAILEYS_REST_URL: $BAILEYS_URL"
else
    echo "   ⚠️  BAILEYS_REST_URL não encontrado no .env"
fi

echo ""

# Parar containers existentes
echo -e "${YELLOW}🛑 Parando containers existentes...${NC}"
docker-compose -f docker-compose.ci.yml down
echo -e "${GREEN}✅ Containers parados${NC}"
echo ""

# Remover imagens antigas (opcional, descomente se necessário)
# echo -e "${YELLOW}🗑️  Removendo imagens antigas...${NC}"
# docker rmi z7design/secured-guard-backend:ci z7design/secured-guard-frontend:ci z7design/secured-guard-whatsapp:ci 2>/dev/null || true
# echo -e "${GREEN}✅ Imagens removidas${NC}"
# echo ""

# Verificar se a rede z7network existe
echo -e "${YELLOW}🌐 Verificando rede Docker...${NC}"
if docker network ls | grep -q "z7network"; then
    echo -e "${GREEN}✅ Rede z7network existe${NC}"
else
    echo -e "${YELLOW}⚠️  Rede z7network não existe, criando...${NC}"
    docker network create z7network || echo "   (pode já existir)"
fi
echo ""

# Subir containers
echo -e "${YELLOW}🚀 Subindo containers...${NC}"
docker-compose -f docker-compose.ci.yml up -d
echo ""

# Aguardar alguns segundos
echo -e "${YELLOW}⏳ Aguardando containers iniciarem...${NC}"
sleep 10

# Verificar status dos containers
echo -e "${GREEN}📊 Status dos containers:${NC}"
docker-compose -f docker-compose.ci.yml ps
echo ""

# Verificar logs do backend
echo -e "${YELLOW}📋 Últimas linhas do log do backend:${NC}"
docker logs --tail 20 secured-guard-backend-ci 2>&1 | tail -10 || echo "   Container ainda não iniciou"
echo ""

# Verificar logs do WhatsApp
echo -e "${YELLOW}📋 Últimas linhas do log do WhatsApp:${NC}"
docker logs --tail 20 secured-guard-whatsapp-ci 2>&1 | tail -10 || echo "   Container ainda não iniciou"
echo ""

# Verificar conectividade entre containers
echo -e "${YELLOW}🔍 Verificando conectividade entre containers...${NC}"
if docker exec secured-guard-backend-ci curl -f http://whatsapp-service-ci:3333/health 2>/dev/null; then
    echo -e "${GREEN}✅ Backend consegue acessar WhatsApp service${NC}"
else
    echo -e "${RED}❌ Backend NÃO consegue acessar WhatsApp service${NC}"
    echo "   Verifique se o container whatsapp-service-ci está rodando"
fi
echo ""

echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "   1. Verificar logs completos: docker-compose -f docker-compose.ci.yml logs -f"
echo "   2. Verificar saúde dos containers: docker-compose -f docker-compose.ci.yml ps"
echo "   3. Testar API: curl http://localhost:8081/api/health"
