#!/bin/bash
# Script para diagnosticar problema de 404 no Traefik

set -e

echo "🔍 Diagnóstico de 404 no Traefik..."
echo ""

# Verificar se Traefik está rodando
echo "1️⃣ Verificando se Traefik está rodando..."
if docker ps | grep -q "traefik"; then
  echo "✅ Traefik está rodando"
  docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
  echo "❌ Traefik NÃO está rodando!"
  exit 1
fi

echo ""
echo "2️⃣ Verificando configuração dinâmica do Traefik..."
if [ -f "/var/www/fluxbus/traefik/dynamic/ci.yml" ]; then
  echo "✅ Arquivo de configuração dinâmica encontrado"
  echo "📋 Conteúdo do arquivo:"
  cat /var/www/fluxbus/traefik/dynamic/ci.yml | head -20
else
  echo "❌ Arquivo de configuração dinâmica NÃO encontrado!"
  echo "   Caminho esperado: /var/www/fluxbus/traefik/dynamic/ci.yml"
fi

echo ""
echo "3️⃣ Verificando routers do Traefik..."
ROUTERS=$(docker exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null || echo "[]")
if echo "$ROUTERS" | grep -q "ci-backend"; then
  echo "✅ Router ci-backend encontrado no Traefik"
  echo "$ROUTERS" | grep -A 10 "ci-backend" || true
else
  echo "❌ Router ci-backend NÃO encontrado no Traefik!"
  echo "📋 Routers disponíveis:"
  echo "$ROUTERS" | jq -r '.[].name' 2>/dev/null || echo "$ROUTERS"
fi

echo ""
echo "4️⃣ Verificando serviços do Traefik..."
SERVICES=$(docker exec traefik wget -qO- http://localhost:8080/api/http/services 2>/dev/null || echo "[]")
if echo "$SERVICES" | grep -q "ci-backend-service"; then
  echo "✅ Serviço ci-backend-service encontrado no Traefik"
  echo "$SERVICES" | grep -A 10 "ci-backend-service" || true
else
  echo "❌ Serviço ci-backend-service NÃO encontrado no Traefik!"
  echo "📋 Serviços disponíveis:"
  echo "$SERVICES" | jq -r '.[].name' 2>/dev/null || echo "$SERVICES"
fi

echo ""
echo "5️⃣ Verificando se Nginx está rodando e acessível..."
if docker ps | grep -q "secured-guard-nginx-ci"; then
  echo "✅ Nginx está rodando"
  docker ps --filter "name=secured-guard-nginx-ci" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  
  # Testar conectividade do Traefik para o Nginx
  echo ""
  echo "6️⃣ Testando conectividade do Traefik para o Nginx..."
  if docker exec traefik wget -qO- --timeout=5 http://secured-guard-nginx-ci:80/health 2>/dev/null | grep -q "healthy"; then
    echo "✅ Traefik consegue acessar o Nginx"
  else
    echo "❌ Traefik NÃO consegue acessar o Nginx!"
    echo "   Verificando se estão na mesma rede..."
    
    # Verificar redes
    TRAEFIK_NETWORKS=$(docker inspect traefik | jq -r '.[0].NetworkSettings.Networks | keys[]' 2>/dev/null || echo "")
    NGINX_NETWORKS=$(docker inspect secured-guard-nginx-ci | jq -r '.[0].NetworkSettings.Networks | keys[]' 2>/dev/null || echo "")
    
    echo "   Redes do Traefik: $TRAEFIK_NETWORKS"
    echo "   Redes do Nginx: $NGINX_NETWORKS"
    
    # Verificar se compartilham a rede z7network
    if echo "$TRAEFIK_NETWORKS" | grep -q "z7network" && echo "$NGINX_NETWORKS" | grep -q "z7network"; then
      echo "   ✅ Ambos estão na rede z7network"
    else
      echo "   ❌ NÃO estão na mesma rede!"
      echo "   💡 Solução: Conectar Nginx à rede z7network"
    fi
  fi
else
  echo "❌ Nginx NÃO está rodando!"
fi

echo ""
echo "7️⃣ Verificando health check do Nginx diretamente..."
if docker exec secured-guard-nginx-ci wget -qO- http://localhost/health 2>/dev/null | grep -q "healthy"; then
  echo "✅ Nginx responde ao health check internamente"
else
  echo "❌ Nginx NÃO responde ao health check!"
  echo "📋 Logs do Nginx:"
  docker logs secured-guard-nginx-ci --tail 20 2>&1 | tail -10
fi

echo ""
echo "8️⃣ Verificando se o Traefik está escutando na porta correta..."
if docker exec traefik netstat -tlnp 2>/dev/null | grep -q ":443\|:80"; then
  echo "✅ Traefik está escutando nas portas 80/443"
else
  echo "⚠️ Não foi possível verificar portas do Traefik (pode ser normal)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Resumo do diagnóstico:"
echo ""
echo "Se o router ci-backend não foi encontrado:"
echo "  1. Verifique se /var/www/fluxbus/traefik/dynamic/ci.yml existe"
echo "  2. Reinicie o Traefik: docker restart traefik"
echo "  3. Aguarde 10 segundos e verifique novamente"
echo ""
echo "Se o Nginx não está acessível pelo Traefik:"
echo "  1. Verifique se ambos estão na rede z7network"
echo "  2. Conecte o Nginx: docker network connect z7network secured-guard-nginx-ci"
echo "  3. Verifique novamente"
echo ""
echo "Para testar manualmente:"
echo "  curl -H 'Host: ci.z7botsolutions.com.br' http://localhost/api/health"
echo ""

