#!/bin/bash

# ============================================
# Script para verificar qual URL o frontend está usando
# ============================================

echo "🔍 Verificando configuração do Frontend CI"
echo "==========================================="

echo ""
echo "📋 1. Verificando imagem Docker..."
docker images | grep fluxbus-frontend:ci

echo ""
echo "📋 2. Verificando container..."
docker ps | grep frontend-ci

echo ""
echo "📋 3. Verificando quando a imagem foi criada..."
docker inspect z7design/fluxbus-frontend:ci 2>/dev/null | grep -E "Created|RepoTags" || echo "⚠️ Imagem não encontrada"

echo ""
echo "📋 4. Verificando arquivos buildados no container..."
echo "   (Isso mostra qual VITE_API_URL foi usado no build)"
docker exec fluxbus-frontend-ci cat /usr/share/nginx/html/assets/*.js 2>/dev/null | grep -o "VITE_API_URL[^,}]*" | head -5 || echo "⚠️ Não foi possível verificar (container pode não estar rodando)"

echo ""
echo "📋 5. Verificando logs do container..."
docker logs --tail 20 fluxbus-frontend-ci 2>/dev/null || echo "⚠️ Container não está rodando"

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "💡 Para verificar no navegador:"
echo "   1. Abra https://ci.z7botsolutions.com.br"
echo "   2. Abra DevTools (F12) → Console"
echo "   3. Procure por: '🔧 Usando VITE_API_URL'"
echo "   4. Deve aparecer: 'https://ci.z7botsolutions.com.br/api'"
echo ""
echo "💡 Se aparecer 'http://localhost:8083/api', execute:"
echo "   ./deploy/fix-frontend-api-url-vps.sh"

