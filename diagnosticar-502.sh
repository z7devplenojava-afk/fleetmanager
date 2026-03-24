#!/bin/bash

# Script para diagnosticar erro 502 Bad Gateway
# Execute na VPS: bash diagnosticar-502.sh

echo "🔍 =========================================="
echo "🔍 DIAGNÓSTICO ERRO 502 BAD GATEWAY"
echo "🔍 =========================================="
echo ""

echo "1️⃣ Verificando status dos containers..."
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml ps

echo ""
echo "2️⃣ Verificando se o backend está rodando..."
if docker ps | grep -q secured-guard-backend-ci; then
    echo "   ✅ Container backend está rodando"
    
    # Verificar health status
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' secured-guard-backend-ci 2>/dev/null || echo "no-healthcheck")
    echo "   Status de saúde: $HEALTH"
else
    echo "   ❌ Container backend NÃO está rodando!"
    echo "   Tentando iniciar..."
    docker-compose -f docker-compose.ci.yml up -d backend-ci
    sleep 10
fi

echo ""
echo "3️⃣ Verificando se o backend está escutando na porta 8081..."
if docker exec secured-guard-backend-ci netstat -tlnp 2>/dev/null | grep -q ":8081"; then
    echo "   ✅ Backend está escutando na porta 8081"
else
    echo "   ❌ Backend NÃO está escutando na porta 8081"
    echo "   Verificando logs..."
    docker logs --tail=30 secured-guard-backend-ci
fi

echo ""
echo "4️⃣ Testando conexão direta ao backend (localhost:8081)..."
RESPONSE=$(docker exec secured-guard-backend-ci curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/health 2>/dev/null || echo "000")
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Backend responde corretamente (HTTP $RESPONSE)"
else
    echo "   ❌ Backend não responde corretamente (HTTP $RESPONSE)"
fi

echo ""
echo "5️⃣ Verificando se o Nginx está rodando..."
if docker ps | grep -q secured-guard-nginx-ci; then
    echo "   ✅ Container Nginx está rodando"
else
    echo "   ❌ Container Nginx NÃO está rodando!"
    echo "   Tentando iniciar..."
    docker-compose -f docker-compose.ci.yml up -d nginx-ci
    sleep 5
fi

echo ""
echo "6️⃣ Testando conexão do Nginx para o Backend..."
NGINX_TO_BACKEND=$(docker exec secured-guard-nginx-ci curl -s -o /dev/null -w "%{http_code}" http://secured-guard-backend-ci:8081/api/health 2>/dev/null || echo "000")
if [ "$NGINX_TO_BACKEND" = "200" ]; then
    echo "   ✅ Nginx consegue conectar ao Backend (HTTP $NGINX_TO_BACKEND)"
else
    echo "   ❌ Nginx NÃO consegue conectar ao Backend (HTTP $NGINX_TO_BACKEND)"
fi

echo ""
echo "7️⃣ Verificando logs do backend (últimas 50 linhas)..."
docker logs --tail=50 secured-guard-backend-ci 2>&1 | tail -30

echo ""
echo "8️⃣ Verificando logs do Nginx (últimas 30 linhas)..."
docker logs --tail=30 secured-guard-nginx-ci 2>&1 | tail -20

echo ""
echo "9️⃣ Verificando JWT_SECRET no container backend..."
JWT_SECRET=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    echo "   JWT_SECRET está definido: $JWT_LENGTH caracteres"
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ⚠️ JWT_SECRET ainda é muito curto!"
    else
        echo "   ✅ JWT_SECRET tem tamanho adequado"
    fi
else
    echo "   ⚠️ JWT_SECRET não está definido no container"
fi

echo ""
echo "🔟 Verificando se há erros de inicialização..."
ERRORS=$(docker logs secured-guard-backend-ci 2>&1 | grep -i -E "(error|exception|failed|❌)" | tail -10)
if [ -n "$ERRORS" ]; then
    echo "   ⚠️ Erros encontrados nos logs:"
    echo "$ERRORS"
else
    echo "   ✅ Nenhum erro crítico encontrado nos logs recentes"
fi

echo ""
echo "✅ =========================================="
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "✅ =========================================="
echo ""
echo "💡 Próximos passos:"
echo "   - Se o backend não está rodando, execute: docker-compose -f docker-compose.ci.yml up -d"
echo "   - Se o backend está crashando, verifique os logs: docker logs secured-guard-backend-ci"
echo "   - Se o JWT_SECRET está errado, execute: bash corrigir-jwt-urgente.sh"

