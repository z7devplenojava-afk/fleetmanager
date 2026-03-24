#!/bin/bash

# Script para diagnosticar e corrigir problema de conexão Nginx -> Backend
# Execute na VPS: bash fix-nginx-backend-connection.sh

set -e

echo "🔍 Diagnosticando problema de conexão Nginx -> Backend..."

cd ~/secured_guard || cd /var/www/secured_guard/ci || {
    echo "❌ Diretório do projeto não encontrado!"
    exit 1
}

echo ""
echo "📋 1. Verificando status dos containers..."
docker-compose -f docker-compose.ci.yml ps

echo ""
echo "📋 2. Verificando redes Docker..."
docker network ls | grep secured-guard

echo ""
echo "📋 3. Verificando IPs dos containers..."
echo "Backend IP:"
docker inspect secured-guard-backend-ci | grep -A 20 "Networks" | grep -E "(IPAddress|NetworkMode)" || docker inspect secured-guard-backend-ci | grep IPAddress

echo ""
echo "Nginx IP:"
docker inspect secured-guard-nginx-ci | grep -A 20 "Networks" | grep -E "(IPAddress|NetworkMode)" || docker inspect secured-guard-nginx-ci | grep IPAddress

echo ""
echo "📋 4. Testando resolução DNS do Nginx..."
docker exec secured-guard-nginx-ci nslookup secured-guard-backend-ci || docker exec secured-guard-nginx-ci ping -c 1 secured-guard-backend-ci || echo "⚠️ Não foi possível resolver o nome do container"

echo ""
echo "📋 5. Testando conectividade do Nginx para o Backend..."
docker exec secured-guard-nginx-ci wget -O- --timeout=5 http://secured-guard-backend-ci:8081/api/health 2>&1 || echo "⚠️ Não foi possível conectar ao backend"

echo ""
echo "📋 6. Verificando se o backend está escutando na porta 8081..."
docker exec secured-guard-backend-ci netstat -tlnp | grep 8081 || docker exec secured-guard-backend-ci ss -tlnp | grep 8081 || echo "⚠️ Comando netstat/ss não disponível"

echo ""
echo "📋 7. Verificando logs do Nginx (últimas 20 linhas)..."
docker logs --tail=20 secured-guard-nginx-ci

echo ""
echo "📋 8. Verificando logs do Backend (últimas 20 linhas)..."
docker logs --tail=20 secured-guard-backend-ci

echo ""
echo "🔧 9. Tentando reiniciar containers..."
docker-compose -f docker-compose.ci.yml restart nginx-ci
sleep 3
docker-compose -f docker-compose.ci.yml restart backend-ci

echo ""
echo "⏳ Aguardando 10 segundos para containers iniciarem..."
sleep 10

echo ""
echo "📋 10. Testando novamente após reinício..."
docker exec secured-guard-nginx-ci wget -O- --timeout=5 http://secured-guard-backend-ci:8081/api/health 2>&1 || echo "⚠️ Ainda não foi possível conectar"

echo ""
echo "✅ Diagnóstico concluído!"

