#!/bin/bash

# Script para testar conexão Nginx -> Backend
# Execute na VPS: bash test-backend-connection.sh

echo "🔍 Testando conexão Nginx -> Backend..."

echo ""
echo "1️⃣ Testando do Nginx para o Backend (com Host header)..."
docker exec fluxbus-nginx-ci wget -O- --header="Host: ci.z7botsolutions.com.br" http://fluxbus-backend-ci:8081/api/health 2>&1 | head -20

echo ""
echo "2️⃣ Testando do Nginx para o Backend (com curl)..."
docker exec fluxbus-nginx-ci curl -v -H "Host: ci.z7botsolutions.com.br" http://fluxbus-backend-ci:8081/api/health 2>&1 | head -30

echo ""
echo "3️⃣ Testando diretamente no backend (localhost)..."
docker exec fluxbus-backend-ci curl -s http://localhost:8081/api/health

echo ""
echo "4️⃣ Verificando logs do backend (últimas 10 linhas)..."
docker logs --tail=10 fluxbus-backend-ci | grep -E "(health|400|error)" || docker logs --tail=10 fluxbus-backend-ci

echo ""
echo "5️⃣ Verificando logs do Nginx (últimas 10 linhas)..."
docker logs --tail=10 fluxbus-nginx-ci | tail -10

echo ""
echo "✅ Teste concluído!"

