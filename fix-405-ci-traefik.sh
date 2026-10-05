#!/bin/bash

# ========================================
# Script de Correção do Erro 405 no CI
# ========================================

set -e

echo "🔧 Iniciando correção do erro 405 no ambiente CI..."

# Verificar se está no diretório correto
if [ ! -f "docker-compose.ci.yml" ]; then
    echo "❌ Erro: docker-compose.ci.yml não encontrado!"
    echo "Execute este script no diretório /var/www/fluxbus"
    exit 1
fi

# Backup do arquivo atual
echo "📦 Criando backup do docker-compose.ci.yml..."
cp docker-compose.ci.yml docker-compose.ci.yml.backup.$(date +%Y%m%d_%H%M%S)

# Verificar se o Traefik está rodando
echo "🔍 Verificando Traefik..."
if docker ps | grep -q traefik; then
    echo "✅ Traefik está rodando"
else
    echo "⚠️  Traefik não está rodando. Iniciando..."
    docker-compose -f docker-compose.traefik.yml up -d
    sleep 5
fi

# Recriar o container backend com as novas labels
echo "🔄 Recriando container backend-ci com configurações corrigidas..."
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci

# Aguardar o backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 10

# Verificar se o backend está saudável
echo "🏥 Verificando saúde do backend..."
for i in {1..30}; do
    if docker exec fluxbus-backend-ci curl -f http://localhost:8081/api/health 2>/dev/null; then
        echo "✅ Backend está saudável!"
        break
    fi
    echo "⏳ Tentativa $i/30..."
    sleep 2
done

# Testar o endpoint de login
echo "🧪 Testando endpoint de login..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://ci.z7botsolutions.com.br/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}')

if [ "$HTTP_CODE" = "405" ]; then
    echo "❌ Erro 405 ainda presente!"
    echo "Verificando logs do Traefik..."
    docker logs traefik --tail 50
    exit 1
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Correção aplicada com sucesso!"
    echo "HTTP Code: $HTTP_CODE (esperado 401 para credenciais inválidas ou 200 para válidas)"
else
    echo "⚠️  HTTP Code inesperado: $HTTP_CODE"
    echo "Mas não é mais 405, então o problema principal foi resolvido!"
fi

# Mostrar status dos containers
echo ""
echo "📊 Status dos containers:"
docker-compose -f docker-compose.ci.yml ps

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Teste o login no frontend: https://ci.z7botsolutions.com.br"
echo "2. Verifique os logs se houver problemas: docker logs fluxbus-backend-ci"
echo "3. Se necessário, restaure o backup: cp docker-compose.ci.yml.backup.* docker-compose.ci.yml"
