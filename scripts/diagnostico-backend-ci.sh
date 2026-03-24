#!/bin/bash

# Script de diagnóstico para Backend CI não respondendo

echo "🔍 DIAGNÓSTICO: Backend CI não está respondendo"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se o container está rodando
echo "1️⃣ Verificando status do container backend-ci:"
if docker ps | grep -q "secured-guard-backend-ci"; then
    echo -e "${GREEN}✅ Container está rodando${NC}"
    docker ps | grep "secured-guard-backend-ci"
else
    echo -e "${RED}❌ Container NÃO está rodando${NC}"
    echo "Containers parados:"
    docker ps -a | grep "secured-guard-backend-ci"
fi
echo ""

# 2. Verificar logs recentes do backend
echo "2️⃣ Logs recentes do backend (últimas 50 linhas):"
docker logs --tail 50 secured-guard-backend-ci 2>&1 | tail -50
echo ""

# 3. Verificar se há erros nos logs
echo "3️⃣ Procurando erros nos logs:"
ERRORS=$(docker logs secured-guard-backend-ci 2>&1 | grep -i "error\|exception\|failed\|fatal" | tail -10)
if [ -z "$ERRORS" ]; then
    echo -e "${GREEN}✅ Nenhum erro encontrado nos logs recentes${NC}"
else
    echo -e "${RED}❌ Erros encontrados:${NC}"
    echo "$ERRORS"
fi
echo ""

# 4. Verificar se o backend está escutando na porta 8080
echo "4️⃣ Verificando se o backend está escutando na porta 8080:"
if docker exec secured-guard-backend-ci netstat -tuln 2>/dev/null | grep -q ":8080"; then
    echo -e "${GREEN}✅ Backend está escutando na porta 8080${NC}"
    docker exec secured-guard-backend-ci netstat -tuln | grep ":8080"
else
    echo -e "${RED}❌ Backend NÃO está escutando na porta 8080${NC}"
    echo "Portas abertas no container:"
    docker exec secured-guard-backend-ci netstat -tuln 2>/dev/null || echo "Não foi possível verificar portas"
fi
echo ""

# 5. Testar healthcheck interno
echo "5️⃣ Testando healthcheck interno do backend:"
HEALTH_RESPONSE=$(docker exec secured-guard-backend-ci curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health 2>&1)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Healthcheck interno passou (HTTP 200)${NC}"
else
    echo -e "${RED}❌ Healthcheck interno falhou (HTTP $HEALTH_RESPONSE)${NC}"
    echo "Resposta completa:"
    docker exec secured-guard-backend-ci curl -v http://localhost:8080/api/health 2>&1 | head -20
fi
echo ""

# 6. Verificar rede Docker
echo "6️⃣ Verificando rede Docker:"
echo "Backend na rede:"
docker network inspect secured-guard-ci-network 2>/dev/null | grep -A 10 "secured-guard-backend-ci" || echo "Rede não encontrada ou backend não está na rede"
echo ""
echo "Nginx na rede:"
docker network inspect secured-guard-ci-network 2>/dev/null | grep -A 10 "secured-guard-nginx-ci" || echo "Rede não encontrada ou nginx não está na rede"
echo ""

# 7. Testar conectividade entre containers
echo "7️⃣ Testando conectividade entre nginx e backend:"
if docker exec secured-guard-nginx-ci ping -c 2 secured-guard-backend-ci > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx consegue fazer ping no backend${NC}"
else
    echo -e "${RED}❌ Nginx NÃO consegue fazer ping no backend${NC}"
fi

echo "Testando resolução DNS:"
docker exec secured-guard-nginx-ci nslookup secured-guard-backend-ci 2>&1 | head -5
echo ""

# 8. Testar conexão HTTP do nginx ao backend
echo "8️⃣ Testando conexão HTTP do nginx ao backend:"
HTTP_TEST=$(docker exec secured-guard-nginx-ci wget -qO- --timeout=5 http://secured-guard-backend-ci:8080/api/health 2>&1)
if echo "$HTTP_TEST" | grep -q "200\|healthy"; then
    echo -e "${GREEN}✅ Nginx consegue conectar ao backend${NC}"
else
    echo -e "${RED}❌ Nginx NÃO consegue conectar ao backend${NC}"
    echo "Resposta: $HTTP_TEST"
fi
echo ""

# 9. Verificar recursos do sistema
echo "9️⃣ Verificando recursos do sistema:"
echo "Uso de memória do backend:"
docker stats --no-stream secured-guard-backend-ci 2>/dev/null | tail -1 || echo "Não foi possível verificar stats"
echo ""

# 10. Verificar healthcheck do Docker
echo "🔟 Verificando status do healthcheck:"
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' secured-guard-backend-ci 2>/dev/null)
if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Healthcheck do Docker: HEALTHY${NC}"
elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
    echo -e "${RED}❌ Healthcheck do Docker: UNHEALTHY${NC}"
    echo "Últimas tentativas de healthcheck:"
    docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' secured-guard-backend-ci 2>/dev/null | tail -5
elif [ "$HEALTH_STATUS" = "starting" ]; then
    echo -e "${YELLOW}⚠️ Healthcheck do Docker: STARTING (ainda inicializando)${NC}"
else
    echo -e "${YELLOW}⚠️ Status do healthcheck: $HEALTH_STATUS${NC}"
fi
echo ""

# 11. Verificar última linha dos logs (para ver se terminou de inicializar)
echo "1️⃣1️⃣ Verificando se o backend terminou de inicializar:"
LAST_LINE=$(docker logs secured-guard-backend-ci 2>&1 | tail -1)
echo "Última linha dos logs: $LAST_LINE"

if echo "$LAST_LINE" | grep -qi "started\|ready\|listening"; then
    echo -e "${GREEN}✅ Backend parece ter terminado de inicializar${NC}"
elif echo "$LAST_LINE" | grep -qi "error\|exception\|failed"; then
    echo -e "${RED}❌ Backend pode ter falhado na inicialização${NC}"
else
    echo -e "${YELLOW}⚠️ Não é possível determinar se o backend terminou de inicializar${NC}"
fi
echo ""

# 12. Recomendações
echo "💡 RECOMENDAÇÕES:"
echo "=================="
if ! docker ps | grep -q "secured-guard-backend-ci"; then
    echo "1. Reiniciar o backend: docker-compose -f docker-compose.ci.yml up -d backend-ci"
fi

if [ "$HEALTH_STATUS" = "unhealthy" ]; then
    echo "2. Verificar logs completos: docker logs secured-guard-backend-ci"
    echo "3. Verificar se há problemas de memória/disco"
fi

if [ "$HEALTH_RESPONSE" != "200" ]; then
    echo "4. O backend pode estar demorando para inicializar. Aguardar mais tempo."
    echo "5. Verificar se há migrations pendentes ou problemas no banco de dados"
fi

echo ""
echo "✅ Diagnóstico concluído!"

