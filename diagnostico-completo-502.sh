#!/bin/bash

# Script completo para diagnosticar erro 502 Bad Gateway
# Execute na VPS: bash diagnostico-completo-502.sh

echo "🔍 =========================================="
echo "🔍 DIAGNÓSTICO COMPLETO - ERRO 502"
echo "🔍 =========================================="
echo ""

cd /var/www/fluxbus/ci

echo "1️⃣ STATUS DOS CONTAINERS"
echo "=========================================="
docker-compose -f docker-compose.ci.yml ps
echo ""

echo "2️⃣ VERIFICANDO SE BACKEND ESTÁ RODANDO"
echo "=========================================="
if docker ps | grep -q fluxbus-backend-ci; then
    echo "✅ Container backend está rodando"
    CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' fluxbus-backend-ci)
    echo "   Status: $CONTAINER_STATUS"
    
    if [ "$CONTAINER_STATUS" != "running" ]; then
        echo "   ⚠️ Container não está em estado 'running'!"
        echo "   Tentando iniciar..."
        docker-compose -f docker-compose.ci.yml up -d backend-ci
        sleep 15
    fi
else
    echo "❌ Container backend NÃO está rodando!"
    echo "   Tentando iniciar..."
    docker-compose -f docker-compose.ci.yml up -d backend-ci
    sleep 15
fi
echo ""

echo "3️⃣ VERIFICANDO SE BACKEND ESTÁ ESCUTANDO NA PORTA 8081"
echo "=========================================="
if docker exec fluxbus-backend-ci netstat -tlnp 2>/dev/null | grep -q ":8081"; then
    echo "✅ Backend está escutando na porta 8081"
    docker exec fluxbus-backend-ci netstat -tlnp 2>/dev/null | grep ":8081"
else
    echo "❌ Backend NÃO está escutando na porta 8081"
    echo "   Verificando logs para entender o problema..."
    docker logs --tail=50 fluxbus-backend-ci 2>&1 | tail -30
fi
echo ""

echo "4️⃣ TESTANDO HEALTH CHECK DO BACKEND (localhost:8081)"
echo "=========================================="
HEALTH_RESPONSE=$(docker exec fluxbus-backend-ci curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:8081/api/health 2>/dev/null || echo "ERROR")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend responde corretamente (HTTP $HTTP_CODE)"
    echo "   Resposta: $BODY"
else
    echo "❌ Backend não responde corretamente"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Resposta: $BODY"
fi
echo ""

echo "5️⃣ VERIFICANDO NGINX"
echo "=========================================="
if docker ps | grep -q fluxbus-nginx-ci; then
    echo "✅ Container Nginx está rodando"
    
    # Testar conexão do Nginx para o Backend
    echo "   Testando conexão Nginx -> Backend..."
    NGINX_TO_BACKEND=$(docker exec fluxbus-nginx-ci curl -s -w "\nHTTP_CODE:%{http_code}" http://fluxbus-backend-ci:8081/api/health 2>/dev/null || echo "ERROR")
    NGINX_HTTP_CODE=$(echo "$NGINX_TO_BACKEND" | grep "HTTP_CODE" | cut -d: -f2)
    
    if [ "$NGINX_HTTP_CODE" = "200" ]; then
        echo "   ✅ Nginx consegue conectar ao Backend (HTTP $NGINX_HTTP_CODE)"
    else
        echo "   ❌ Nginx NÃO consegue conectar ao Backend (HTTP $NGINX_HTTP_CODE)"
        echo "   Resposta: $NGINX_TO_BACKEND"
    fi
else
    echo "❌ Container Nginx NÃO está rodando!"
    echo "   Tentando iniciar..."
    docker-compose -f docker-compose.ci.yml up -d nginx-ci
    sleep 5
fi
echo ""

echo "6️⃣ VERIFICANDO JWT_SECRET"
echo "=========================================="
JWT_SECRET=$(docker exec fluxbus-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    echo "   JWT_SECRET está definido: $JWT_LENGTH caracteres"
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ❌ JWT_SECRET é muito curto! Precisa de pelo menos 64 caracteres"
        echo "   Execute: bash corrigir-jwt-urgente.sh"
    else
        echo "   ✅ JWT_SECRET tem tamanho adequado"
    fi
else
    echo "   ⚠️ JWT_SECRET não está definido no container"
    echo "   Execute: bash corrigir-jwt-urgente.sh"
fi
echo ""

echo "7️⃣ ÚLTIMOS LOGS DO BACKEND (50 linhas)"
echo "=========================================="
docker logs --tail=50 fluxbus-backend-ci 2>&1 | tail -50
echo ""

echo "8️⃣ VERIFICANDO ERROS NOS LOGS"
echo "=========================================="
ERRORS=$(docker logs fluxbus-backend-ci 2>&1 | grep -i -E "(error|exception|failed|❌|fatal)" | tail -20)
if [ -n "$ERRORS" ]; then
    echo "⚠️ Erros encontrados:"
    echo "$ERRORS"
else
    echo "✅ Nenhum erro crítico encontrado nos logs recentes"
fi
echo ""

echo "9️⃣ VERIFICANDO CONFIGURAÇÃO DO NGINX"
echo "=========================================="
if docker exec fluxbus-nginx-ci nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Configuração do Nginx está válida"
else
    echo "❌ Configuração do Nginx tem erros!"
    docker exec fluxbus-nginx-ci nginx -t
fi
echo ""

echo "🔟 TESTANDO CONEXÃO EXTERNA (se possível)"
echo "=========================================="
echo "   Testando http://localhost:8082 (Nginx)..."
NGINX_EXTERNAL=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082 2>/dev/null || echo "000")
if [ "$NGINX_EXTERNAL" != "000" ]; then
    echo "   Nginx responde na porta 8082: HTTP $NGINX_EXTERNAL"
else
    echo "   ⚠️ Não foi possível testar Nginx externamente"
fi
echo ""

echo "✅ =========================================="
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "✅ =========================================="
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo ""
echo "   Se o backend não está rodando:"
echo "   → docker-compose -f docker-compose.ci.yml up -d backend-ci"
echo ""
echo "   Se o backend está crashando:"
echo "   → docker logs fluxbus-backend-ci"
echo ""
echo "   Se o JWT_SECRET está errado:"
echo "   → bash corrigir-jwt-urgente.sh"
echo ""
echo "   Para reiniciar tudo:"
echo "   → docker-compose -f docker-compose.ci.yml restart"
echo ""

