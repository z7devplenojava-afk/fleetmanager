#!/bin/bash

# Script para corrigir problemas de git pull no ambiente CI
# Execute na VPS: bash deploy/fix-git-pull-ci.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Corrigindo git pull no ambiente CI...${NC}"
echo ""

# Navegar para o diretório correto
cd /var/www/fluxbus/ci

# Verificar status atual
echo -e "${YELLOW}📊 Status atual do Git:${NC}"
git status --short
echo ""

# Verificar quais arquivos têm mudanças
echo -e "${YELLOW}📋 Arquivos com mudanças locais:${NC}"
git diff --name-only
echo ""

# Fazer backup do .env (importante não perder)
if [ -f ".env" ]; then
    echo -e "${GREEN}💾 Fazendo backup do .env...${NC}"
    cp .env /tmp/.env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado em /tmp/.env.backup.*"
fi

# Fazer backup do docker-compose.ci.yml (para comparação depois)
if [ -f "docker-compose.ci.yml" ]; then
    echo -e "${GREEN}💾 Fazendo backup do docker-compose.ci.yml...${NC}"
    cp docker-compose.ci.yml /tmp/docker-compose.ci.yml.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado em /tmp/docker-compose.ci.yml.backup.*"
fi

# Descartar mudanças locais e atualizar do repositório
echo -e "${YELLOW}🔄 Descartando mudanças locais e atualizando do repositório...${NC}"
git fetch origin ci
git reset --hard origin/ci
echo -e "${GREEN}✅ Repositório atualizado!${NC}"
echo ""

# Verificar status final
echo -e "${GREEN}📊 Status final:${NC}"
git status
echo ""

# Verificar último commit
echo -e "${GREEN}📝 Último commit:${NC}"
git log -1 --oneline
echo ""

echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "   1. Verificar se o .env está correto (foi feito backup em /tmp/)"
echo "   2. Se necessário, restaurar o .env: cp /tmp/.env.backup.* .env"
echo "   3. Reiniciar containers: docker-compose -f docker-compose.ci.yml up -d"
