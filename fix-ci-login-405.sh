#!/bin/bash

# Script de correção do erro 405 no login CI
# Uso: bash fix-ci-login-405.sh

set -e

echo "🔧 Iniciando correção do erro 405 no login CI..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Verificar qual proxy está rodando
log_info "Verificando proxies ativos..."
NGINX_RUNNING=$(docker ps --filter "name=nginx" --format "{{.Names}}" | grep -c "nginx" || echo "0")
TRAEFIK_RUNNING=$(docker ps --filter "name=traefik" --format "{{.Names}}" | grep -c "traefik" || echo "0")

if [ "$NGINX_RUNNING" -gt 0 ]; then
    log_info "✅ NGINX detectado: $(docker ps --filter 'name=nginx' --format '{{.Names}}')"
    PROXY="nginx"
elif [ "$TRAEFIK_RUNNING" -gt 0 ]; then
    log_info "✅ Traefik detectado: $(docker ps --filter 'name=traefik' --format '{{.Names}}')"
    PROXY="traefik"
else
    log_error "❌ Nenhum proxy detectado rodando!"
    exit 1
fi

echo ""

# 2. Verificar backend
log_info "Verificando backend..."
BACKEND_RUNNING=$(docker ps --filter "name=backend-ci" --format "{{.Names}}" | wc -l)

if [ "$BACKEND_RUNNING" -eq 0 ]; then
    log_error "❌ Backend CI não está rodando!"
    exit 1
fi

BACKEND_CONTAINER=$(docker ps --filter "name=backend-ci" --format "{{.Names}}")
log_info "✅ Backend detectado: $BACKEND_CONTAINER"

# Verificar health do backend
log_info "Verificando saúde do backend..."
BACKEND_HEALTH=$(docker exec "$BACKEND_CONTAINER" curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health || echo "000")

if [ "$BACKEND_HEALTH" == "200" ]; then
    log_info "✅ Backend está saudável (HTTP $BACKEND_HEALTH)"
else
    log_warn "⚠️  Backend pode estar com problemas (HTTP $BACKEND_HEALTH)"
fi

echo ""

# 3. Testar endpoint de login diretamente no backend
log_info "Testando endpoint /api/auth/login diretamente no backend..."
LOGIN_TEST=$(docker exec "$BACKEND_CONTAINER" curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' || echo "000")

if [ "$LOGIN_TEST" == "401" ] || [ "$LOGIN_TEST" == "403" ] || [ "$LOGIN_TEST" == "200" ]; then
    log_info "✅ Endpoint /api/auth/login está respondendo (HTTP $LOGIN_TEST)"
else
    log_error "❌ Endpoint /api/auth/login não está respondendo corretamente (HTTP $LOGIN_TEST)"
fi

echo ""

# 4. Aplicar correção baseada no proxy
if [ "$PROXY" == "nginx" ]; then
    log_info "Aplicando correção no NGINX..."
    
    NGINX_CONTAINER=$(docker ps --filter "name=nginx" --format "{{.Names}}" | head -n 1)
    
    # Testar configuração
    log_info "Testando configuração do NGINX..."
    if docker exec "$NGINX_CONTAINER" nginx -t 2>&1 | grep -q "successful"; then
        log_info "✅ Configuração do NGINX está válida"
        
        # Recarregar NGINX
        log_info "Recarregando NGINX..."
        docker exec "$NGINX_CONTAINER" nginx -s reload
        log_info "✅ NGINX recarregado com sucesso"
    else
        log_error "❌ Configuração do NGINX inválida!"
        docker exec "$NGINX_CONTAINER" nginx -t
        exit 1
    fi
    
elif [ "$PROXY" == "traefik" ]; then
    log_info "Verificando configuração do Traefik..."
    log_warn "⚠️  Traefik requer labels no docker-compose. Verifique o arquivo docker-compose."
    log_info "Execute: docker-compose -f docker-compose.ci.yml up -d --force-recreate backend"
fi

echo ""

# 5. Verificar logs recentes
log_info "Últimas 10 linhas de log do backend:"
docker logs "$BACKEND_CONTAINER" --tail 10

echo ""

# 6. Teste final
log_info "Aguardando 5 segundos para estabilização..."
sleep 5

log_info "Testando login através do proxy..."
PROXY_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST https://ci.z7botsolutions.com.br/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' || echo "000")

echo ""
if [ "$PROXY_TEST" == "401" ] || [ "$PROXY_TEST" == "403" ] || [ "$PROXY_TEST" == "200" ]; then
    log_info "✅ SUCESSO! Login está respondendo através do proxy (HTTP $PROXY_TEST)"
    log_info "🎉 Correção aplicada com sucesso!"
elif [ "$PROXY_TEST" == "405" ]; then
    log_error "❌ FALHA! Ainda retornando 405"
    log_error "Verifique manualmente a configuração do $PROXY"
    exit 1
else
    log_warn "⚠️  Resposta inesperada: HTTP $PROXY_TEST"
    log_warn "Verifique os logs para mais detalhes"
fi

echo ""
log_info "📋 Resumo:"
log_info "  - Proxy: $PROXY"
log_info "  - Backend: $BACKEND_CONTAINER (HTTP $BACKEND_HEALTH)"
log_info "  - Login direto: HTTP $LOGIN_TEST"
log_info "  - Login via proxy: HTTP $PROXY_TEST"

echo ""
log_info "✅ Script finalizado!"
