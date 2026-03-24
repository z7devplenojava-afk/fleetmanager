#!/bin/bash
# Script para corrigir configuração do Traefik na VPS

set -e

echo "🔧 Corrigindo configuração do Traefik na VPS..."

# 1. Remover healthCheck do arquivo ci.yml
CONFIG_FILE="/var/www/secured_guard/traefik/dynamic/ci.yml"

if [ -f "$CONFIG_FILE" ]; then
    echo "📝 Removendo healthCheck do arquivo de configuração..."
    
    # Criar backup
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remover healthCheck usando sed
    sed -i '/# Health check/,/^[[:space:]]*healthCheck:/d' "$CONFIG_FILE"
    sed -i '/^[[:space:]]*healthCheck:/,/^[[:space:]]*path:/d' "$CONFIG_FILE"
    sed -i '/^[[:space:]]*interval:/d' "$CONFIG_FILE"
    sed -i '/^[[:space:]]*timeout:/d' "$CONFIG_FILE"
    sed -i '/^[[:space:]]*scheme:/d' "$CONFIG_FILE"
    
    # Verificar se ainda tem healthCheck
    if grep -q "healthCheck" "$CONFIG_FILE"; then
        echo "⚠️ Ainda há referências a healthCheck. Removendo manualmente..."
        # Remover linhas que contenham healthCheck
        sed -i '/healthCheck/d' "$CONFIG_FILE"
    fi
    
    echo "✅ Arquivo corrigido!"
    echo ""
    echo "📋 Conteúdo do arquivo após correção:"
    cat "$CONFIG_FILE"
else
    echo "❌ Arquivo $CONFIG_FILE não encontrado!"
    exit 1
fi

# 2. Reiniciar Traefik
echo ""
echo "🔄 Reiniciando Traefik..."
docker restart traefik
sleep 15

# 3. Verificar se o erro sumiu
echo ""
echo "🔍 Verificando logs do Traefik..."
if docker logs traefik --tail 30 2>&1 | grep -q "healthCheck"; then
    echo "❌ Ainda há erro relacionado a healthCheck!"
    docker logs traefik --tail 30 | grep -i "error\|healthCheck"
    exit 1
else
    echo "✅ Nenhum erro relacionado a healthCheck encontrado!"
fi

# 4. Verificar routers
echo ""
echo "🔍 Verificando routers do Traefik..."
ROUTERS=$(docker exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null || echo "[]")
echo "Routers disponíveis:"
echo "$ROUTERS" | jq -r '.[].name' 2>/dev/null || echo "$ROUTERS"

# 5. Verificar se Nginx tem labels corretas
echo ""
echo "🔍 Verificando labels do Nginx..."
if docker ps | grep -q "secured-guard-nginx-ci"; then
    echo "Labels do Nginx:"
    docker inspect secured-guard-nginx-ci | jq -r '.[0].Config.Labels' | grep traefik || echo "Nenhuma label Traefik encontrada"
    
    # Verificar se está na rede z7network
    if docker inspect secured-guard-nginx-ci 2>/dev/null | grep -q "z7network"; then
        echo "✅ Nginx está na rede z7network"
    else
        echo "⚠️ Nginx NÃO está na rede z7network. Conectando..."
        docker network connect z7network secured-guard-nginx-ci 2>/dev/null || echo "⚠️ Erro ao conectar"
    fi
else
    echo "❌ Container Nginx não está rodando!"
fi

# 6. Testar acesso
echo ""
echo "🧪 Testando acesso..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k -H "Host: ci.z7botsolutions.com.br" https://localhost/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Acesso funcionando! (HTTP $HTTP_CODE)"
else
    echo "⚠️ Ainda retornando HTTP $HTTP_CODE"
    echo "💡 Verificando routers novamente..."
    docker exec traefik wget -qO- http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("nginx") or contains("ci"))'
fi

echo ""
echo "✅ Correção concluída!"

