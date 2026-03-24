#!/bin/bash

# Script para reiniciar todos os serviços
# Execute na VPS: bash reiniciar-tudo.sh

set -e

echo "🔄 =========================================="
echo "🔄 REINICIANDO TODOS OS SERVIÇOS"
echo "🔄 =========================================="
echo ""

cd /var/www/secured_guard/ci

echo "1️⃣ Parando todos os containers..."
docker-compose -f docker-compose.ci.yml down
echo "   ✅ Containers parados"

echo ""
echo "2️⃣ Aguardando 5 segundos..."
sleep 5

echo ""
echo "3️⃣ Iniciando todos os containers..."
docker-compose -f docker-compose.ci.yml up -d
echo "   ✅ Containers iniciados"

echo ""
echo "4️⃣ Aguardando containers iniciarem (60s)..."
sleep 60

echo ""
echo "5️⃣ Verificando status dos containers..."
docker-compose -f docker-compose.ci.yml ps

echo ""
echo "6️⃣ Verificando se o backend está respondendo..."
MAX_RETRIES=10
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    RESPONSE=$(docker exec secured-guard-backend-ci curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/health 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ]; then
        echo "   ✅ Backend está respondendo (HTTP $RESPONSE)"
        break
    else
        RETRY=$((RETRY + 1))
        if [ $RETRY -lt $MAX_RETRIES ]; then
            echo "   ⏳ Aguardando backend iniciar... (tentativa $RETRY/$MAX_RETRIES)"
            sleep 10
        else
            echo "   ❌ Backend não está respondendo após $MAX_RETRIES tentativas"
            echo "   Verificando logs..."
            docker logs --tail=50 secured-guard-backend-ci
            exit 1
        fi
    fi
done

echo ""
echo "7️⃣ Verificando JWT_SECRET..."
JWT_SECRET=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    echo "   JWT_SECRET: $JWT_LENGTH caracteres"
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ⚠️ JWT_SECRET ainda é muito curto! Execute: bash corrigir-jwt-urgente.sh"
    else
        echo "   ✅ JWT_SECRET está OK"
    fi
else
    echo "   ⚠️ JWT_SECRET não está definido! Execute: bash corrigir-jwt-urgente.sh"
fi

echo ""
echo "✅ =========================================="
echo "✅ REINÍCIO CONCLUÍDO"
echo "✅ =========================================="
echo ""
echo "🌐 Teste o acesso: https://ci.z7botsolutions.com.br"

