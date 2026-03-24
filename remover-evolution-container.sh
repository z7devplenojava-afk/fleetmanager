#!/bin/bash

# Script para remover o container Evolution API
# Execute na VPS: bash remover-evolution-container.sh

echo "🗑️  Removendo container Evolution API..."

cd /var/www/secured_guard/ci

# Parar e remover o container se estiver rodando
if docker ps -a | grep -q evolution-api-ci; then
    echo "   Parando container evolution-api-ci..."
    docker stop evolution-api-ci 2>/dev/null || true
    docker rm evolution-api-ci 2>/dev/null || true
    echo "   ✅ Container evolution-api-ci removido"
else
    echo "   ℹ️ Container evolution-api-ci não encontrado"
fi

# Remover da rede se ainda estiver conectado
echo "   Removendo da rede..."
docker network disconnect secured-guard-ci evolution-api-ci 2>/dev/null || true
docker network disconnect z7network evolution-api-ci 2>/dev/null || true

echo ""
echo "✅ Container Evolution API removido!"
echo ""
echo "💡 Para aplicar as mudanças do docker-compose.ci.yml:"
echo "   docker-compose -f docker-compose.ci.yml up -d"

