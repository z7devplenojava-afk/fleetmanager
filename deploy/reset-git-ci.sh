#!/bin/bash

# Script para resetar mudanças locais no ambiente CI
# Execute na VPS: bash deploy/reset-git-ci.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Verificando e corrigindo mudanças locais no Git...${NC}"
echo ""

# Navegar para o diretório correto
cd /var/www/secured_guard/ci

# Verificar status atual
echo -e "${YELLOW}📊 Status atual do Git:${NC}"
git status --short
echo ""

# Verificar se há mudanças locais
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Mudanças locais detectadas!${NC}"
    echo ""
    
    # Fazer backup do .env (importante não perder)
    if [ -f ".env" ]; then
        echo -e "${GREEN}💾 Fazendo backup do .env...${NC}"
        cp .env /tmp/.env.backup.$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup criado em /tmp/.env.backup.*"
    fi
    
    # Descartar mudanças locais
    echo -e "${YELLOW}🔄 Descartando mudanças locais...${NC}"
    git reset --hard HEAD
    git clean -fd
    echo -e "${GREEN}✅ Mudanças locais descartadas!${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Nenhuma mudança local detectada!${NC}"
    echo ""
fi

# Verificar se está sincronizado com origin/ci
echo -e "${YELLOW}🔄 Verificando sincronização com origin/ci...${NC}"
git fetch origin ci 2>/dev/null || echo "⚠️  Não foi possível fazer fetch (pode ser problema de autenticação)"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/ci 2>/dev/null || echo "")

if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    echo -e "${YELLOW}⚠️  Repositório local não está sincronizado com origin/ci${NC}"
    echo "   Local:  $LOCAL"
    echo "   Remote: $REMOTE"
    echo ""
    echo -e "${YELLOW}🔄 Atualizando para origin/ci...${NC}"
    git reset --hard origin/ci
    echo -e "${GREEN}✅ Repositório atualizado!${NC}"
else
    echo -e "${GREEN}✅ Repositório está sincronizado!${NC}"
fi

echo ""
echo -e "${GREEN}📊 Status final:${NC}"
git status
echo ""

echo -e "${GREEN}📝 Último commit:${NC}"
git log -1 --oneline
echo ""

echo -e "${GREEN}✅ Processo concluído!${NC}"
