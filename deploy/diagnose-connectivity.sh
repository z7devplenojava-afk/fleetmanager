#!/bin/bash

# ========================================
# DIAGNÓSTICO CONECTIVIDADE VPS
# Script para diagnosticar problemas de SSH na VPS
# ========================================

set -e

echo "🔍 DIAGNÓSTICO CONECTIVIDADE VPS"
echo "================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se estamos na VPS
if [ -f "/opt/secured-guard/deploy.sh" ]; then
    log "Executando na VPS - verificando serviços locais..."
    
    log "1. Verificando status dos containers..."
    cd /opt/secured-guard
    docker compose -f deploy/docker-compose.prod.yml ps
    
    log "2. Verificando logs do backend..."
    if docker ps -q -f name=secured-guard-backend-prod | grep -q .; then
        docker logs --tail=20 secured-guard-backend-prod
    else
        error "Backend não está rodando"
    fi
    
    log "3. Verificando conectividade interna..."
    curl -f http://localhost:8080/actuator/health 2>/dev/null && echo "✅ Backend local OK" || echo "❌ Backend local falhou"
    
    log "4. Verificando firewall..."
    ufw status
    
    log "5. Verificando SSH daemon..."
    systemctl status ssh
    
    log "6. Verificando portas SSH..."
    netstat -tlnp | grep :22
    
    log "7. Verificando configuração SSH..."
    cat /etc/ssh/sshd_config | grep -E "^(Port|PasswordAuthentication|PermitRootLogin)" | head -5
    
    log "8. Verificando logs SSH..."
    tail -10 /var/log/auth.log
    
    log "9. Testando conectividade de rede..."
    ping -c 3 8.8.8.8
    
    log "10. Verificando espaço em disco..."
    df -h /
    
    echo ""
    log "CORREÇÃO AUTOMÁTICA:"
    echo "=================="
    
    log "Parando e reiniciando serviços..."
    docker compose -f deploy/docker-compose.prod.yml down
    sleep 5
    docker compose -f deploy/docker-compose.prod.yml up -d
    sleep 30
    
    log "Verificando status após reinício..."
    docker compose -f deploy/docker-compose.prod.yml ps
    
    log "Testando health check..."
    curl -f http://localhost:8080/actuator/health 2>/dev/null && echo "✅ Backend funcionando!" || echo "❌ Backend ainda com problemas"
    
else
    log "Executando localmente - verificando conectividade com VPS..."
    
    # Verificar se variáveis estão definidas
    if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_PORT" ]; then
        error "Variáveis VPS_HOST, VPS_USER ou VPS_PORT não definidas"
        exit 1
    fi
    
    log "1. Testando conectividade básica..."
    ping -c 3 $VPS_HOST || error "Não foi possível fazer ping na VPS"
    
    log "2. Testando porta SSH..."
    nc -zv $VPS_HOST $VPS_PORT || error "Porta SSH não está acessível"
    
    log "3. Testando conexão SSH..."
    ssh -p $VPS_PORT -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST "echo 'SSH OK'" || error "Conexão SSH falhou"
    
    log "4. Verificando chaves SSH..."
    ls -la ~/.ssh/
    
    log "5. Testando com verbose SSH..."
    ssh -p $VPS_PORT -v $VPS_USER@$VPS_HOST "echo 'SSH verbose OK'" 2>&1 | tail -10
    
    log "6. Verificando configuração SSH local..."
    cat ~/.ssh/config 2>/dev/null || echo "Arquivo ~/.ssh/config não existe"
    
    log "7. Testando com sshpass (se disponível)..."
    if command -v sshpass &> /dev/null; then
        echo "sshpass disponível"
    else
        warning "sshpass não instalado"
    fi
fi

echo ""
echo "================================="
log "DIAGNÓSTICO CONCLUÍDO"
echo "================================="
