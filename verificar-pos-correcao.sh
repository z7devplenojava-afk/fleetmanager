#!/bin/bash

# Script para verificar se a correção do JWT_SECRET funcionou
# Execute na VPS: bash verificar-pos-correcao.sh

echo "🔍 =========================================="
echo "🔍 VERIFICAÇÃO PÓS-CORREÇÃO JWT_SECRET"
echo "🔍 =========================================="
echo ""

cd /var/www/fluxbus/ci

echo "1️⃣ Verificando status dos containers..."
docker-compose -f docker-compose.ci.yml ps
echo ""

echo "2️⃣ Verificando JWT_SECRET no container backend..."
JWT_SECRET=$(docker exec fluxbus-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    echo "   JWT_SECRET está definido: $JWT_LENGTH caracteres"
    echo "   Primeiros 30 caracteres: ${JWT_SECRET:0:30}..."
    
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ❌ ERRO: JWT_SECRET ainda é muito curto! ($JWT_LENGTH caracteres)"
        echo "   Precisa de pelo menos 64 caracteres"
    else
        echo "   ✅ JWT_SECRET tem tamanho adequado ($JWT_LENGTH caracteres)"
    fi
else
    echo "   ❌ ERRO: JWT_SECRET não está definido no container!"
fi
echo ""

echo "3️⃣ Aguardando backend iniciar completamente (30s)..."
sleep 30
echo ""

echo "4️⃣ Testando health check do backend..."
HEALTH=$(docker exec fluxbus-backend-ci curl -s http://localhost:8081/api/health 2>/dev/null || echo "ERROR")
if echo "$HEALTH" | grep -q "status"; then
    echo "   ✅ Backend está respondendo"
    echo "   Resposta: $HEALTH"
else
    echo "   ⚠️ Backend pode não estar totalmente iniciado"
fi
echo ""

echo "5️⃣ Verificando logs do backend para erros de JWT..."
JWT_ERRORS=$(docker logs --tail=100 fluxbus-backend-ci 2>&1 | grep -i -E "(jwt|token|chave.*curta)" | tail -5)
if [ -n "$JWT_ERRORS" ]; then
    echo "   ⚠️ Ainda há erros relacionados a JWT:"
    echo "$JWT_ERRORS"
else
    echo "   ✅ Nenhum erro de JWT encontrado nos logs recentes"
fi
echo ""

echo "6️⃣ Testando login diretamente..."
LOGIN_RESPONSE=$(docker exec fluxbus-backend-ci curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' 2>/dev/null || echo "ERROR")

if echo "$LOGIN_RESPONSE" | grep -q "Unauthorized"; then
    echo "   ✅ Login endpoint está funcionando (retornou 401 - credenciais inválidas, mas não erro 500)"
elif echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "   ✅ Login funcionou! Token gerado com sucesso"
else
    echo "   ⚠️ Resposta inesperada: $LOGIN_RESPONSE"
fi
echo ""

echo "✅ =========================================="
echo "✅ VERIFICAÇÃO CONCLUÍDA"
echo "✅ =========================================="
echo ""
echo "💡 Se o JWT_SECRET ainda estiver errado:"
echo "   1. Verifique se há arquivo .env: cat .env | grep JWT_SECRET"
echo "   2. Verifique variáveis do host: printenv | grep JWT_SECRET"
echo "   3. Execute novamente: bash corrigir-jwt-urgente.sh"

