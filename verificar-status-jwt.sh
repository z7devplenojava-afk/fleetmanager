#!/bin/bash

# Script para verificar status do JWT_SECRET após deploy
# Execute na VPS: bash verificar-status-jwt.sh

echo "🔍 =========================================="
echo "🔍 VERIFICAÇÃO DO JWT_SECRET APÓS DEPLOY"
echo "🔍 =========================================="
echo ""

echo "1️⃣ Verificando JWT_SECRET no container backend..."
JWT_SECRET_IN_CONTAINER=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")

if [ -z "$JWT_SECRET_IN_CONTAINER" ]; then
    echo "❌ ERRO: JWT_SECRET não está definido no container!"
else
    JWT_LENGTH=${#JWT_SECRET_IN_CONTAINER}
    echo "✅ JWT_SECRET está definido no container"
    echo "📏 Tamanho: $JWT_LENGTH caracteres"
    echo "🔑 Primeiros 30 caracteres: ${JWT_SECRET_IN_CONTAINER:0:30}..."
    
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "❌ ERRO: JWT_SECRET é muito curto! Precisa de pelo menos 64 caracteres."
    else
        echo "✅ JWT_SECRET tem tamanho adequado (mínimo: 64 caracteres)"
    fi
fi

echo ""
echo "2️⃣ Verificando logs do backend (últimas 50 linhas)..."
docker logs --tail=50 secured-guard-backend-ci 2>&1 | grep -i -E "(jwt|token|error|exception|500)" | tail -20

echo ""
echo "3️⃣ Testando login diretamente..."
docker exec secured-guard-backend-ci curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v 2>&1 | head -30

echo ""
echo "4️⃣ Verificando se o container está usando a imagem mais recente..."
docker inspect secured-guard-backend-ci | grep -i image

echo ""
echo "5️⃣ Verificando data de criação do container..."
docker inspect secured-guard-backend-ci | grep -i created

echo ""
echo "✅ Verificação concluída!"

