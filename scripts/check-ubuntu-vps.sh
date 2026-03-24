#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🐧 Verificando VPS Ubuntu..."

# ========================================
# 1. VERIFICAR SISTEMA
# ========================================
log "1. Verificando sistema Ubuntu..."
echo "🐧 Distribuição: $(lsb_release -d | cut -f2)"
echo "📅 Versão: $(lsb_release -r | cut -f2)"
echo "🏗️ Arquitetura: $(uname -m)"
echo "💾 Memória: $(free -h | grep Mem | awk '{print $2}')"
echo "💿 Disco: $(df -h / | tail -1 | awk '{print $4}') disponível"

# ========================================
# 2. VERIFICAR JAVA
# ========================================
log "2. Verificando Java..."
if command -v java &> /dev/null; then
    echo "✅ Java: $(java -version 2>&1 | head -n 1)"
else
    error "❌ Java não instalado!"
fi

# ========================================
# 3. VERIFICAR MAVEN
# ========================================
log "3. Verificando Maven..."
if command -v mvn &> /dev/null; then
    echo "✅ Maven: $(mvn -version | head -n 1)"
else
    error "❌ Maven não instalado!"
fi

# ========================================
# 4. VERIFICAR NODE.JS
# ========================================
log "4. Verificando Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
    echo "✅ npm: $(npm --version)"
else
    error "❌ Node.js não instalado!"
fi

# ========================================
# 5. VERIFICAR DOCKER
# ========================================
log "5. Verificando Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
    echo "✅ Docker Compose: $(docker compose version)"
    echo "🐳 Containers rodando: $(docker ps --format 'table {{.Names}}\t{{.Status}}')"
else
    error "❌ Docker não instalado!"
fi

# ========================================
# 6. VERIFICAR POSTGRESQL
# ========================================
log "6. Verificando PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL: Ativo"
    echo "🐘 Banco secured_guard: $(sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='secured_guard';" | grep -c "1" || echo "0")"
else
    error "❌ PostgreSQL não está rodando!"
fi

# ========================================
# 7. VERIFICAR NGINX
# ========================================
log "7. Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Ativo"
    echo "🌐 Porta 80: $(netstat -tlnp | grep :80 | wc -l) serviços"
    echo "🌐 Porta 443: $(netstat -tlnp | grep :443 | wc -l) serviços"
else
    error "❌ Nginx não está rodando!"
fi

# ========================================
# 8. VERIFICAR FIREWALL
# ========================================
log "8. Verificando Firewall UFW..."
if command -v ufw &> /dev/null; then
    echo "✅ UFW: $(ufw status | head -n 1)"
    echo "🔒 Regras ativas: $(ufw status | grep -c "ALLOW")"
else
    error "❌ UFW não instalado!"
fi

# ========================================
# 9. VERIFICAR DIRETÓRIO DO PROJETO
# ========================================
log "9. Verificando diretório do projeto..."
if [ -d "/opt/secured-guard" ]; then
    echo "✅ Diretório /opt/secured-guard existe"
    echo "📁 Tamanho: $(du -sh /opt/secured-guard 2>/dev/null | cut -f1 || echo "0B")"
    echo "👤 Proprietário: $(ls -ld /opt/secured-guard | awk '{print $3":"$4}')"
else
    warn "⚠️ Diretório /opt/secured-guard não existe"
fi

# ========================================
# 10. VERIFICAR APLICAÇÃO WEB
# ========================================
log "10. Verificando aplicação web..."
if curl -f -s https://securedguard.z7botsolutions.com.br > /dev/null; then
    echo "✅ Aplicação web está funcionando"
    echo "🌐 URL: https://securedguard.z7botsolutions.com.br"
else
    warn "⚠️ Aplicação web não está respondendo"
    echo "🔍 Tentando IP direto..."
    if curl -f -s http://localhost > /dev/null; then
        echo "✅ Nginx responde localmente"
    else
        error "❌ Nginx não responde nem localmente"
    fi
fi

# ========================================
# 11. VERIFICAR SERVIÇOS DOCKER
# ========================================
log "11. Verificando serviços Docker..."
if [ -f "/opt/secured-guard/deploy/docker-compose.prod.yml" ]; then
    cd /opt/secured-guard
    echo "🐳 Serviços Docker:"
    docker compose -f deploy/docker-compose.prod.yml ps
else
    warn "⚠️ Docker Compose não configurado"
fi

log "🎉 Verificação completa!"
log "💡 Se algum item estiver com ❌, execute o script de instalação"
log "📋 Script de instalação: ./scripts/install-ubuntu-vps.sh"
