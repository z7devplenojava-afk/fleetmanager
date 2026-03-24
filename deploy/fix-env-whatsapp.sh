#!/bin/bash

# Script para corrigir a URL do WhatsApp no .env
# Execute na VPS: bash deploy/fix-env-whatsapp.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Corrigindo URL do WhatsApp no .env...${NC}"
echo ""

# Navegar para o diretório correto
cd /var/www/secured_guard/ci

# Fazer backup do .env
if [ -f ".env" ]; then
    echo -e "${GREEN}💾 Fazendo backup do .env...${NC}"
    cp .env /tmp/.env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado"
fi

# Corrigir BAILEYS_REST_URL
echo -e "${YELLOW}🔄 Corrigindo BAILEYS_REST_URL...${NC}"
if grep -q "BAILEYS_REST_URL=" .env; then
    # Substituir a linha existente
    sed -i 's|BAILEYS_REST_URL=.*|BAILEYS_REST_URL=http://whatsapp-service-ci:3333|' .env
    echo -e "${GREEN}✅ BAILEYS_REST_URL corrigido${NC}"
else
    # Adicionar se não existir
    echo "BAILEYS_REST_URL=http://whatsapp-service-ci:3333" >> .env
    echo -e "${GREEN}✅ BAILEYS_REST_URL adicionado${NC}"
fi

# Verificar resultado
echo ""
echo -e "${GREEN}📋 Configuração atual do WhatsApp:${NC}"
grep -E "BAILEYS_" .env
echo ""

echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "   Reiniciar o container do backend para aplicar as mudanças:"
echo "   docker-compose -f docker-compose.ci.yml restart backend-ci"
