#!/bin/bash

# ========================================
# Script de Correção do Erro 521 (Cloudflare)
# ========================================
# O erro 521 significa que o Cloudflare não consegue se conectar ao Traefik

set -e

echo "🔧 Iniciando correção do erro 521 (Cloudflare não consegue conectar ao Traefik)..."

# Verificar se está no diretório correto
if [ ! -f "docker-compose.traefik.yml" ]; then
    echo "❌ Erro: docker-compose.traefik.yml não encontrado!"
    echo "Execute este script no diretório /var/www/fluxbus"
    exit 1
fi

# ========================================
# 1. Verificar se a rede z7network existe
# ========================================
echo ""
echo "🔍 Verificando rede z7network..."
if docker network ls | grep -q "z7network"; then
    echo "✅ Rede z7network existe"
else
    echo "⚠️  Rede z7network não existe. Criando..."
    docker network create z7network
    echo "✅ Rede z7network criada"
fi

# ========================================
# 2. Verificar se o Traefik está rodando
# ========================================
echo ""
echo "🔍 Verificando Traefik..."
if docker ps | grep -q "traefik"; then
    echo "✅ Traefik está rodando"
    TRAEFIK_RUNNING=true
else
    echo "⚠️  Traefik não está rodando"
    TRAEFIK_RUNNING=false
fi

# ========================================
# 3. Verificar se o Traefik está na rede z7network
# ========================================
if [ "$TRAEFIK_RUNNING" = true ]; then
    echo ""
    echo "🔍 Verificando se Traefik está na rede z7network..."
    if docker inspect traefik | grep -q "z7network"; then
        echo "✅ Traefik está na rede z7network"
    else
        echo "⚠️  Traefik não está na rede z7network. Reconectando..."
        docker network connect z7network traefik || echo "⚠️  Falha ao conectar (pode já estar conectado)"
    fi
fi

# ========================================
# 4. Verificar se o Traefik está escutando nas portas corretas
# ========================================
if [ "$TRAEFIK_RUNNING" = true ]; then
    echo ""
    echo "🔍 Verificando portas do Traefik..."
    if netstat -tlnp 2>/dev/null | grep -q ":80.*traefik" || ss -tlnp 2>/dev/null | grep -q ":80.*traefik"; then
        echo "✅ Traefik está escutando na porta 80"
    else
        echo "⚠️  Traefik não está escutando na porta 80"
    fi
    
    if netstat -tlnp 2>/dev/null | grep -q ":443.*traefik" || ss -tlnp 2>/dev/null | grep -q ":443.*traefik"; then
        echo "✅ Traefik está escutando na porta 443"
    else
        echo "⚠️  Traefik não está escutando na porta 443"
    fi
fi

# ========================================
# 5. Verificar configuração dinâmica do Traefik
# ========================================
echo ""
echo "🔍 Verificando configuração dinâmica do Traefik..."
if [ -f "/var/www/fluxbus/traefik/dynamic/ci.yml" ]; then
    echo "✅ Arquivo de configuração dinâmica existe"
else
    echo "⚠️  Arquivo de configuração dinâmica não existe em /var/www/fluxbus/traefik/dynamic/ci.yml"
    echo "📝 Criando diretório se não existir..."
    mkdir -p /var/www/fluxbus/traefik/dynamic
    echo "⚠️  Você precisa transferir o arquivo traefik-dynamic-ci.yml para /var/www/fluxbus/traefik/dynamic/ci.yml"
fi

# ========================================
# 6. Reiniciar Traefik se necessário
# ========================================
if [ "$TRAEFIK_RUNNING" = false ]; then
    echo ""
    echo "🔄 Iniciando Traefik..."
    cd /var/www/fluxbus
    docker-compose -f docker-compose.traefik.yml up -d
    
    echo "⏳ Aguardando Traefik iniciar (15s)..."
    sleep 15
    
    # Verificar se iniciou
    if docker ps | grep -q "traefik"; then
        echo "✅ Traefik iniciado com sucesso"
    else
        echo "❌ Traefik não iniciou! Verificando logs..."
        docker logs traefik --tail 50
        exit 1
    fi
else
    echo ""
    echo "🔄 Reiniciando Traefik para garantir que está configurado corretamente..."
    cd /var/www/fluxbus
    docker-compose -f docker-compose.traefik.yml restart
    
    echo "⏳ Aguardando Traefik reiniciar (10s)..."
    sleep 10
fi

# ========================================
# 7. Verificar logs do Traefik
# ========================================
echo ""
echo "📋 Últimas linhas dos logs do Traefik:"
docker logs traefik --tail 30

# ========================================
# 8. Verificar se o Traefik está respondendo
# ========================================
echo ""
echo "🧪 Testando se o Traefik está respondendo..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200\|301\|302"; then
    echo "✅ Traefik está respondendo na porta 80"
else
    echo "⚠️  Traefik não está respondendo na porta 80"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/overview | grep -q "200"; then
    echo "✅ Dashboard do Traefik está acessível"
else
    echo "⚠️  Dashboard do Traefik não está acessível"
fi

# ========================================
# 9. Verificar se o nginx-ci está na rede z7network
# ========================================
echo ""
echo "🔍 Verificando se nginx-ci está na rede z7network..."
if docker ps | grep -q "nginx-ci"; then
    if docker inspect fluxbus-nginx-ci | grep -q "z7network"; then
        echo "✅ nginx-ci está na rede z7network"
    else
        echo "⚠️  nginx-ci não está na rede z7network. Reconectando..."
        docker network connect z7network fluxbus-nginx-ci || echo "⚠️  Falha ao conectar (pode já estar conectado)"
    fi
else
    echo "⚠️  nginx-ci não está rodando"
fi

# ========================================
# 10. Testar conectividade entre Traefik e nginx-ci
# ========================================
echo ""
echo "🧪 Testando conectividade entre Traefik e nginx-ci..."
if docker exec traefik ping -c 1 fluxbus-nginx-ci > /dev/null 2>&1; then
    echo "✅ Traefik consegue alcançar nginx-ci"
else
    echo "⚠️  Traefik não consegue alcançar nginx-ci"
fi

# ========================================
# 11. Verificar routers do Traefik
# ========================================
echo ""
echo "🔍 Verificando routers do Traefik..."
if curl -s http://localhost:8080/api/http/routers | grep -q "nginx-ci"; then
    echo "✅ Router nginx-ci está configurado no Traefik"
else
    echo "⚠️  Router nginx-ci não está configurado no Traefik"
    echo "📋 Routers disponíveis:"
    curl -s http://localhost:8080/api/http/routers | grep -o '"name":"[^"]*"' | head -10 || echo "Não foi possível listar routers"
fi

echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Verifique se o Cloudflare está configurado para usar o IP correto do servidor"
echo "2. Verifique se as portas 80 e 443 estão abertas no firewall"
echo "3. Verifique se o Traefik está escutando nas portas corretas:"
echo "   - Porta 80 (HTTP)"
echo "   - Porta 443 (HTTPS)"
echo "4. Teste acessar https://ci.z7botsolutions.com.br diretamente (sem Cloudflare)"
echo "5. Verifique os logs do Traefik para erros: docker logs traefik --tail 100"



















