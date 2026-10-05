#!/bin/bash

# ============================================
# Script para corrigir VITE_API_URL na VPS
# ============================================

set -e

echo "🔧 Corrigindo VITE_API_URL no Frontend CI"
echo "=========================================="

# Caminho do projeto
PROJECT_DIR="/var/www/fluxbus/ci"
cd "$PROJECT_DIR" || exit 1

echo ""
echo "📋 1. Verificando imagem atual do frontend..."
docker images | grep fluxbus-frontend:ci || echo "⚠️ Imagem não encontrada localmente"

echo ""
echo "📋 2. Verificando container atual..."
docker ps -a | grep frontend-ci || echo "⚠️ Container não encontrado"

echo ""
echo "📋 3. Parando e removendo container antigo..."
docker-compose -f docker-compose.ci.yml stop frontend-ci 2>/dev/null || true
docker-compose -f docker-compose.ci.yml rm -f frontend-ci 2>/dev/null || true

echo ""
echo "📋 4. Removendo imagem antiga (forçando pull da nova)..."
docker rmi z7design/fluxbus-frontend:ci 2>/dev/null || echo "⚠️ Imagem não encontrada para remover (ok, será feito pull)"

echo ""
echo "📋 5. Fazendo pull da nova imagem do Docker Hub..."
docker pull z7design/fluxbus-frontend:ci

echo ""
echo "📋 6. Verificando se a nova imagem foi baixada..."
docker images | grep fluxbus-frontend:ci

echo ""
echo "📋 7. Recriando e iniciando o container..."
docker-compose -f docker-compose.ci.yml up -d frontend-ci

echo ""
echo "📋 8. Aguardando container iniciar..."
sleep 5

echo ""
echo "📋 9. Verificando status do container..."
docker ps | grep frontend-ci

echo ""
echo "📋 10. Verificando logs (últimas 30 linhas)..."
docker logs --tail 30 fluxbus-frontend-ci

echo ""
echo "✅ Processo concluído!"
echo ""
echo "🔍 Para verificar se está funcionando:"
echo "   1. Abra o navegador em https://ci.z7botsolutions.com.br"
echo "   2. Abra o DevTools (F12) → Console"
echo "   3. Procure por: '🔧 Usando VITE_API_URL: https://ci.z7botsolutions.com.br/api'"
echo "   4. Se aparecer 'http://localhost:8083/api', a imagem ainda está antiga"
echo ""
echo "📋 Para ver logs em tempo real:"
echo "   docker logs -f fluxbus-frontend-ci"

