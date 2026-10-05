#!/bin/bash

# Script para verificar erro 500 no login
# Execute na VPS: bash verificar-erro-500-login.sh

echo "🔍 =========================================="
echo "🔍 VERIFICANDO ERRO 500 NO LOGIN"
echo "🔍 =========================================="
echo ""

echo "1️⃣ Verificando logs do backend (últimas 100 linhas)..."
echo "=========================================="
docker logs --tail=100 fluxbus-backend-ci 2>&1 | tail -100
echo ""

echo "2️⃣ Filtrando erros relacionados a login/JWT..."
echo "=========================================="
docker logs --tail=200 fluxbus-backend-ci 2>&1 | grep -i -E "(login|auth|jwt|token|error|exception|500)" | tail -30
echo ""

echo "3️⃣ Testando login diretamente no backend..."
echo "=========================================="
docker exec fluxbus-backend-ci curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v 2>&1 | head -50
echo ""

echo "4️⃣ Verificando JWT_SECRET no container..."
echo "=========================================="
JWT_SECRET=$(docker exec fluxbus-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    echo "   JWT_SECRET está definido: $JWT_LENGTH caracteres"
    echo "   Primeiros 30 caracteres: ${JWT_SECRET:0:30}..."
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ❌ JWT_SECRET é muito curto! Precisa de pelo menos 64 caracteres"
    else
        echo "   ✅ JWT_SECRET tem tamanho adequado"
    fi
else
    echo "   ❌ JWT_SECRET não está definido no container!"
fi
echo ""

echo "5️⃣ Verificando variáveis de ambiente do backend..."
echo "=========================================="
docker exec fluxbus-backend-ci printenv | grep -E "(JWT|SPRING)" | sort
echo ""

echo "6️⃣ Verificando se há erros de inicialização..."
echo "=========================================="
docker logs fluxbus-backend-ci 2>&1 | grep -i -E "(started|failed|error|exception)" | tail -20
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "💡 Se o JWT_SECRET estiver errado, execute:"
echo "   bash corrigir-jwt-urgente.sh"

