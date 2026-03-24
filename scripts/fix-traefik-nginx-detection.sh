#!/bin/bash
# Script para corrigir detecção do Nginx pelo Traefik

set -e

echo "🔧 Corrigindo detecção do Nginx pelo Traefik..."
echo ""

# 1. Verificar se Nginx está rodando
echo "1️⃣ Verificando Nginx..."
if ! docker ps | grep -q "secured-guard-nginx-ci"; then
  echo "❌ Nginx não está rodando!"
  exit 1
else
  echo "✅ Nginx está rodando"
fi

# 2. Verificar se Nginx está na rede z7network
echo ""
echo "2️⃣ Verificando rede do Nginx..."
if docker inspect secured-guard-nginx-ci 2>/dev/null | grep -q "z7network"; then
  echo "✅ Nginx está na rede z7network"
else
  echo "⚠️ Nginx não está na rede z7network. Conectando..."
  docker network connect z7network secured-guard-nginx-ci 2>/dev/null || echo "⚠️ Pode já estar conectado"
  sleep 2
  if docker inspect secured-guard-nginx-ci 2>/dev/null | grep -q "z7network"; then
    echo "✅ Nginx conectado à rede z7network"
  else
    echo "❌ Falha ao conectar Nginx à rede z7network"
    exit 1
  fi
fi

# 3. Verificar labels do Nginx
echo ""
echo "3️⃣ Verificando labels do Nginx..."
LABELS=$(docker inspect secured-guard-nginx-ci | jq -r '.[0].Config.Labels' 2>/dev/null || echo "{}")
if echo "$LABELS" | grep -q "traefik.enable"; then
  echo "✅ Labels do Traefik encontradas no Nginx"
  echo "$LABELS" | jq -r 'to_entries[] | select(.key | startswith("traefik")) | "  \(.key) = \(.value)"' 2>/dev/null || echo "  (não foi possível listar labels)"
else
  echo "❌ Labels do Traefik NÃO encontradas no Nginx!"
  echo "   Isso significa que o docker-compose.ci.yml não está aplicando as labels corretamente"
  exit 1
fi

# 4. Verificar se Traefik está detectando o container
echo ""
echo "4️⃣ Verificando se Traefik está detectando o Nginx..."
CONTAINERS=$(docker exec traefik wget -qO- http://localhost:8080/api/http/services 2>/dev/null || echo "[]")
if echo "$CONTAINERS" | grep -q "nginx-ci"; then
  echo "✅ Traefik está detectando o Nginx"
else
  echo "❌ Traefik NÃO está detectando o Nginx!"
  echo ""
  echo "💡 Possíveis causas:"
  echo "   1. Traefik não está na mesma rede (z7network)"
  echo "   2. Traefik precisa ser reiniciado para detectar novos containers"
  echo "   3. providers.docker.exposedbydefault=false está bloqueando"
  echo ""
  echo "🔄 Reiniciando Traefik..."
  docker restart traefik
  sleep 15
  
  # Verificar novamente
  CONTAINERS=$(docker exec traefik wget -qO- http://localhost:8080/api/http/services 2>/dev/null || echo "[]")
  if echo "$CONTAINERS" | grep -q "nginx-ci"; then
    echo "✅ Traefik agora está detectando o Nginx"
  else
    echo "❌ Traefik ainda não está detectando o Nginx"
    echo ""
    echo "📋 Verificando configuração do Traefik:"
    docker inspect traefik | jq -r '.[0].Config.Labels' 2>/dev/null | grep -i "docker" || echo "Nenhuma label docker encontrada"
    echo ""
    echo "📋 Verificando se Traefik está na rede z7network:"
    docker inspect traefik | jq -r '.[0].NetworkSettings.Networks | keys[]' 2>/dev/null || echo "Não foi possível verificar redes"
  fi
fi

# 5. Verificar routers
echo ""
echo "5️⃣ Verificando routers do Traefik..."
ROUTERS=$(docker exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null || echo "[]")
if echo "$ROUTERS" | grep -q "nginx-ci"; then
  echo "✅ Router nginx-ci encontrado no Traefik"
  echo "$ROUTERS" | jq -r '.[] | select(.name | contains("nginx-ci")) | "  \(.name): \(.rule)"' 2>/dev/null || echo "  (não foi possível listar detalhes)"
else
  echo "❌ Router nginx-ci NÃO encontrado no Traefik!"
  echo ""
  echo "📋 Routers disponíveis:"
  echo "$ROUTERS" | jq -r '.[].name' 2>/dev/null | head -10 || echo "$ROUTERS"
  echo ""
  echo "💡 Tentando recriar container do Nginx para forçar detecção..."
  cd /var/www/secured_guard/ci
  docker-compose -f docker-compose.ci.yml up -d --force-recreate nginx-ci
  sleep 10
  
  # Reiniciar Traefik novamente
  docker restart traefik
  sleep 15
  
  # Verificar novamente
  ROUTERS=$(docker exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null || echo "[]")
  if echo "$ROUTERS" | grep -q "nginx-ci"; then
    echo "✅ Router nginx-ci agora encontrado!"
  else
    echo "❌ Router ainda não encontrado"
  fi
fi

# 6. Testar acesso
echo ""
echo "6️⃣ Testando acesso..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ci.z7botsolutions.com.br" http://localhost/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Acesso funcionando! (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
  echo "⚠️ Redirecionamento detectado (HTTP $HTTP_CODE)"
  echo "   Testando HTTPS..."
  HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k -H "Host: ci.z7botsolutions.com.br" https://localhost/api/health 2>/dev/null || echo "000")
  if [ "$HTTPS_CODE" = "200" ]; then
    echo "✅ HTTPS funcionando! (HTTP $HTTPS_CODE)"
  else
    echo "⚠️ HTTPS retornou: $HTTPS_CODE"
  fi
elif [ "$HTTP_CODE" = "404" ]; then
  echo "❌ Ainda retornando 404"
  echo ""
  echo "📋 Diagnóstico adicional:"
  echo "   Verificando se Traefik consegue acessar o Nginx:"
  docker exec traefik wget -qO- --timeout=5 http://secured-guard-nginx-ci:80/health 2>&1 | head -3 || echo "   ❌ Falha ao acessar Nginx"
else
  echo "⚠️ Resposta HTTP: $HTTP_CODE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Correção concluída!"
echo ""

