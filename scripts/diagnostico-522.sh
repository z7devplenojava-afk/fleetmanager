#!/bin/bash
# Script de diagnóstico rápido para erro 522 (Connection Timeout)

echo "🔍 Diagnóstico de Erro 522 - Connection Timeout"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se está rodando na VPS
if [ ! -d "/var/www/fluxbus/ci" ]; then
    echo "⚠️ Este script deve ser executado na VPS no diretório /var/www/fluxbus/ci"
    exit 1
fi

cd /var/www/fluxbus/ci

echo "1️⃣ Status dos Containers Docker:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose -f docker-compose.ci.yml ps
echo ""

echo "2️⃣ Verificando Backend (últimas 30 linhas de log):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker logs --tail 30 fluxbus-backend-ci 2>&1 | tail -30
echo ""

echo "3️⃣ Testando Backend Internamente:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8081/api/health 2>&1 || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend está respondendo internamente (HTTP $BACKEND_STATUS)"
else
    echo "❌ Backend NÃO está respondendo internamente (HTTP $BACKEND_STATUS)"
fi
echo ""

echo "4️⃣ Verificando Nginx:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8082/api/health 2>&1 || echo "000")
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "302" ]; then
    echo "✅ Nginx está respondendo (HTTP $NGINX_STATUS)"
else
    echo "❌ Nginx NÃO está respondendo (HTTP $NGINX_STATUS)"
    echo "📋 Logs do Nginx (últimas 20 linhas):"
    docker logs --tail 20 fluxbus-nginx-ci 2>&1 | tail -20
fi
echo ""

echo "5️⃣ Verificando Traefik:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TRAEFIK_STATUS=$(docker ps --filter "name=traefik" --format "{{.Status}}" 2>&1)
if echo "$TRAEFIK_STATUS" | grep -q "Up"; then
    echo "✅ Traefik está rodando"
    echo "   Status: $TRAEFIK_STATUS"
else
    echo "❌ Traefik NÃO está rodando!"
    echo "   Isso pode causar erro 522 do Cloudflare"
fi
echo ""

echo "6️⃣ Verificando Redis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
REDIS_STATUS=$(docker exec fluxbus-redis-ci redis-cli ping 2>&1 || echo "ERROR")
if [ "$REDIS_STATUS" = "PONG" ]; then
    echo "✅ Redis está respondendo"
else
    echo "❌ Redis NÃO está respondendo: $REDIS_STATUS"
fi
echo ""

echo "7️⃣ Verificando PostgreSQL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PG_STATUS=$(docker exec fluxbus-db-ci pg_isready -U postgressg 2>&1 || echo "ERROR")
if echo "$PG_STATUS" | grep -q "accepting connections"; then
    echo "✅ PostgreSQL está aceitando conexões"
else
    echo "❌ PostgreSQL NÃO está aceitando conexões: $PG_STATUS"
fi
echo ""

echo "8️⃣ Uso de Recursos do Sistema:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memória: $(free -h | awk '/^Mem:/ {print $3 "/" $2 " (" $3/$2*100 "%)"}')"
echo "Disco: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " usado)"}')"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Resumo:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$BACKEND_STATUS" = "200" ] && echo "$TRAEFIK_STATUS" | grep -q "Up"; then
    echo "✅ Backend e Traefik estão funcionando"
    echo "💡 Se ainda houver erro 522, pode ser:"
    echo "   - Cloudflare com timeout muito curto"
    echo "   - Backend demorando muito para responder"
    echo "   - Problema de rede entre Cloudflare e servidor"
    echo ""
    echo "🔧 Ações sugeridas:"
    echo "   1. Verificar configuração de timeout no Cloudflare"
    echo "   2. Verificar se há processos bloqueando o backend"
    echo "   3. Reiniciar containers: docker-compose -f docker-compose.ci.yml restart"
else
    echo "❌ Problemas detectados:"
    [ "$BACKEND_STATUS" != "200" ] && echo "   - Backend não está respondendo"
    ! echo "$TRAEFIK_STATUS" | grep -q "Up" && echo "   - Traefik não está rodando"
    echo ""
    echo "🔧 Ações sugeridas:"
    echo "   1. Reiniciar containers: docker-compose -f docker-compose.ci.yml restart"
    echo "   2. Verificar logs: docker logs fluxbus-backend-ci"
    echo "   3. Verificar se há erros de compilação ou configuração"
fi

echo ""
echo "✅ Diagnóstico concluído!"
