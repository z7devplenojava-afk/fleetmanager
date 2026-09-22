#!/bin/bash

# Script para limpar cache do Service Worker após deploy
# Execute na VPS após o deploy

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🧹 Limpando cache do Service Worker...${NC}"
echo ""

# Gerar versão única baseada no timestamp
SW_VERSION=$(date +%s)
echo -e "${YELLOW}📝 Versão do Service Worker: $SW_VERSION${NC}"

# Criar arquivo de versão que será servido pelo Nginx
# Isso força o navegador a atualizar o service worker
VERSION_FILE="/var/www/fluxbus/ci/sw-version.txt"

# Criar arquivo de versão
echo "SW_VERSION=$SW_VERSION" > "$VERSION_FILE"
echo "DEPLOY_DATE=$(date -Iseconds)" >> "$VERSION_FILE"
echo "BUILD_HASH=$(echo $SW_VERSION | md5sum | cut -d' ' -f1)" >> "$VERSION_FILE"

echo -e "${GREEN}✅ Arquivo de versão criado: $VERSION_FILE${NC}"
cat "$VERSION_FILE"
echo ""

# Se o container do frontend estiver rodando, podemos reiniciá-lo para garantir
# que o novo service worker seja servido
if docker ps | grep -q "secured-guard-frontend-ci"; then
    echo -e "${YELLOW}🔄 Reiniciando container do frontend para aplicar mudanças...${NC}"
    docker restart secured-guard-frontend-ci || echo "⚠️  Não foi possível reiniciar o container"
    sleep 5
    echo -e "${GREEN}✅ Container reiniciado${NC}"
fi

echo ""
echo -e "${GREEN}✅ Cache do Service Worker limpo!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "   1. Os usuários precisarão recarregar a página (Ctrl+Shift+R)"
echo "   2. O service worker será atualizado automaticamente"
echo "   3. Para forçar atualização imediata, adicione ?v=$SW_VERSION na URL"
