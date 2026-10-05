#!/bin/bash

# ============================================
# Script para rebuild do frontend CI na VPS
# ============================================

set -e

echo "🔨 Rebuild do Frontend CI na VPS"
echo "=================================="

# Caminho do projeto
PROJECT_DIR="/var/www/fluxbus/ci"
cd "$PROJECT_DIR" || exit 1

echo ""
echo "📦 Fazendo pull das novas imagens do Docker Hub..."
docker pull z7design/fluxbus-frontend:ci

echo ""
echo "🔄 Reiniciando o container do frontend..."
docker-compose -f docker-compose.ci.yml stop frontend-ci
docker-compose -f docker-compose.ci.yml rm -f frontend-ci
docker-compose -f docker-compose.ci.yml up -d frontend-ci

echo ""
echo "✅ Frontend CI reiniciado com sucesso!"
echo ""
echo "🔍 Verificando status do container..."
docker ps | grep frontend-ci

echo ""
echo "📋 Logs do frontend (últimas 20 linhas):"
docker logs --tail 20 fluxbus-frontend-ci

