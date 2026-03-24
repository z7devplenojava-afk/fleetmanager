#!/bin/bash
# ====================================================
# Script de Diagnóstico CI - Executar na VPS
# ====================================================

echo "🔍 =============================================="
echo "🔍 DIAGNÓSTICO COMPLETO DO AMBIENTE CI"
echo "🔍 =============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto
CI_DIR="/var/www/secured_guard/ci"

# ====================================================
# 1. VERIFICAR DIRETÓRIOS
# ====================================================
echo -e "${YELLOW}📂 1. Verificando diretórios...${NC}"
if [ -d "$CI_DIR" ]; then
    echo -e "${GREEN}✅ Diretório CI existe: $CI_DIR${NC}"
    ls -lh "$CI_DIR"
else
    echo -e "${RED}❌ Diretório CI não encontrado: $CI_DIR${NC}"
    exit 1
fi
echo ""

# ====================================================
# 2. VERIFICAR ARQUIVOS DE CONFIGURAÇÃO
# ====================================================
echo -e "${YELLOW}📋 2. Verificando arquivos de configuração...${NC}"
cd "$CI_DIR" || exit 1

if [ -f "docker-compose.ci.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.ci.yml existe${NC}"
else
    echo -e "${RED}❌ docker-compose.ci.yml NÃO encontrado${NC}"
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env existe${NC}"
    echo "Variáveis (sem valores sensíveis):"
    grep -E "^[A-Z_]+" .env | sed 's/=.*/=***/' || true
else
    echo -e "${RED}❌ .env NÃO encontrado${NC}"
fi
echo ""

# ====================================================
# 3. VERIFICAR VOLUMES/DIRETÓRIOS MONTADOS
# ====================================================
echo -e "${YELLOW}💾 3. Verificando volumes...${NC}"
for dir in postgres_data redis_data uploads logs whatsapp_sessions evolution_instances holerites; do
    if [ -d "$dir" ]; then
        SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo -e "${GREEN}✅ $dir - Tamanho: $SIZE${NC}"
    else
        echo -e "${RED}❌ $dir não encontrado${NC}"
    fi
done
echo ""

# ====================================================
# 4. VERIFICAR STATUS DOS CONTAINERS
# ====================================================
echo -e "${YELLOW}🐳 4. Status dos containers...${NC}"
docker-compose -f docker-compose.ci.yml ps
echo ""

# ====================================================
# 5. VERIFICAR HEALTH DOS CONTAINERS
# ====================================================
echo -e "${YELLOW}🏥 5. Health status dos containers...${NC}"
CONTAINERS="secured-guard-backend-ci secured-guard-frontend-ci secured-guard-postgres-ci secured-guard-redis-ci secured-guard-nginx-ci"
for container in $CONTAINERS; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no healthcheck")
        if [ "$STATUS" = "healthy" ]; then
            echo -e "${GREEN}✅ $container - $STATUS${NC}"
        elif [ "$STATUS" = "no healthcheck" ]; then
            echo -e "${YELLOW}⚠️  $container - sem healthcheck configurado${NC}"
        else
            echo -e "${RED}❌ $container - $STATUS${NC}"
        fi
    else
        echo -e "${RED}❌ $container - NÃO ESTÁ RODANDO${NC}"
    fi
done
echo ""

# ====================================================
# 6. TESTAR CONECTIVIDADE INTERNA
# ====================================================
echo -e "${YELLOW}🌐 6. Testando conectividade interna...${NC}"

echo "6.1 PostgreSQL (porta 5432):"
if nc -z localhost 5432 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL respondendo${NC}"
else
    echo -e "${RED}❌ PostgreSQL não responde${NC}"
fi

echo "6.2 Redis (porta 6379):"
if nc -z localhost 6379 2>/dev/null; then
    echo -e "${GREEN}✅ Redis respondendo${NC}"
else
    echo -e "${RED}❌ Redis não responde${NC}"
fi

echo "6.3 Backend (porta 8081):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend respondendo - HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ Backend não responde - HTTP $HTTP_CODE${NC}"
fi

echo "6.4 Frontend (porta 3000):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend respondendo - HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ Frontend não responde - HTTP $HTTP_CODE${NC}"
fi

echo "6.5 Nginx (porta 8082):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ Nginx respondendo - HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ Nginx não responde - HTTP $HTTP_CODE${NC}"
fi

echo "6.6 WhatsApp Service (porta 3333):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ WhatsApp Service respondendo - HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ WhatsApp Service não responde - HTTP $HTTP_CODE${NC}"
fi
echo ""

# ====================================================
# 7. VERIFICAR TRAEFIK
# ====================================================
echo -e "${YELLOW}🚦 7. Verificando Traefik...${NC}"
if docker ps | grep -q traefik; then
    echo -e "${GREEN}✅ Traefik está rodando${NC}"
    docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ Traefik NÃO está rodando!${NC}"
    echo "Containers CI dependem do Traefik para roteamento externo."
fi
echo ""

# ====================================================
# 8. TESTAR URL PÚBLICA
# ====================================================
echo -e "${YELLOW}🌍 8. Testando URL pública...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ci.z7botsolutions.com.br 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ URL pública respondendo - HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ URL pública não responde - HTTP $HTTP_CODE${NC}"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ci.z7botsolutions.com.br/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API Health endpoint respondendo - HTTP $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ API Health endpoint não responde - HTTP $HTTP_CODE${NC}"
fi
echo ""

# ====================================================
# 9. VERIFICAR REDES DOCKER
# ====================================================
echo -e "${YELLOW}🔗 9. Verificando redes Docker...${NC}"
if docker network ls | grep -q secured-guard-ci; then
    echo -e "${GREEN}✅ Rede secured-guard-ci existe${NC}"
    echo "Containers conectados:"
    docker network inspect secured-guard-ci --format='{{range .Containers}}{{.Name}} {{end}}' || true
else
    echo -e "${RED}❌ Rede secured-guard-ci não encontrada${NC}"
fi
echo ""

# ====================================================
# 10. LOGS DOS CONTAINERS
# ====================================================
echo -e "${YELLOW}📋 10. Últimas linhas dos logs...${NC}"

echo -e "\n${YELLOW}Backend (últimas 30 linhas):${NC}"
docker logs --tail 30 secured-guard-backend-ci 2>/dev/null || echo "Container não encontrado"

echo -e "\n${YELLOW}Frontend (últimas 20 linhas):${NC}"
docker logs --tail 20 secured-guard-frontend-ci 2>/dev/null || echo "Container não encontrado"

echo -e "\n${YELLOW}Nginx (últimas 20 linhas):${NC}"
docker logs --tail 20 secured-guard-nginx-ci 2>/dev/null || echo "Container não encontrado"

echo -e "\n${YELLOW}PostgreSQL (últimas 10 linhas):${NC}"
docker logs --tail 10 secured-guard-postgres-ci 2>/dev/null || echo "Container não encontrado"

echo -e "\n${YELLOW}Redis (últimas 10 linhas):${NC}"
docker logs --tail 10 secured-guard-redis-ci 2>/dev/null || echo "Container não encontrado"

echo ""
echo "🔍 =============================================="
echo "🔍 DIAGNÓSTICO COMPLETO"
echo "🔍 =============================================="
echo ""
echo "💡 Próximos passos:"
echo "   1. Se algum container não está rodando: docker-compose -f docker-compose.ci.yml up -d"
echo "   2. Ver logs completos: docker logs -f secured-guard-backend-ci"
echo "   3. Reiniciar containers: docker-compose -f docker-compose.ci.yml restart"
echo "   4. Verificar Traefik: docker logs traefik"
echo ""

