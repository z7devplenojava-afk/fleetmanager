#!/bin/bash

# ========================================
# DEPLOY EVOLUTION API NO AMBIENTE CI
# ========================================

set -e  # Exit on error

echo "========================================"
echo "  🚀 DEPLOY EVOLUTION API PARA CI"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Fazendo commit das alterações...${NC}"
git add docker-compose.ci.yml
git add backend/src/main/resources/application-ci.properties
git commit -m "feat: Adicionar Evolution API ao ambiente CI

- Adicionar serviço evolution-api-ci ao docker-compose.ci.yml
- Configurar Evolution API com PostgreSQL e Redis
- Adicionar configurações de Evolution API ao application-ci.properties
- Expor Evolution API via Traefik em evolution.z7botsolutions.com.br
- Configurar whatsapp.provider=evolution no perfil CI
"
echo -e "${GREEN}   ✅ Commit realizado!${NC}"
echo ""

echo -e "${YELLOW}2. Fazendo push para repositório...${NC}"
git push origin ci
echo -e "${GREEN}   ✅ Push realizado!${NC}"
echo ""

echo -e "${CYAN}3. Conectando ao servidor CI via SSH...${NC}"
echo ""

# Comandos a serem executados no servidor
ssh root@ci.z7botsolutions.com.br << 'ENDSSH'
echo "========================================"
echo "  📦 ATUALIZANDO AMBIENTE CI"
echo "========================================"
echo ""

cd /var/www/secured_guard/ci

echo "1. Fazendo pull das alterações..."
git pull origin ci
echo "   ✅ Pull realizado!"
echo ""

echo "2. Criando banco evolution_ci..."
docker exec secured-guard-db-ci psql -U secured_guard_ci -c "CREATE DATABASE evolution_ci;" 2>/dev/null || echo "   ⚠️  Banco já existe"
echo "   ✅ Banco pronto!"
echo ""

echo "3. Criando diretórios necessários..."
mkdir -p /var/www/secured_guard/ci/evolution_instances
mkdir -p /var/www/secured_guard/ci/holerites
chmod -R 755 /var/www/secured_guard/ci/evolution_instances
chmod -R 755 /var/www/secured_guard/ci/holerites
echo "   ✅ Diretórios criados!"
echo ""

echo "4. Iniciando Evolution API..."
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml up -d evolution-api-ci
echo "   ✅ Evolution API iniciada!"
echo ""

echo "5. Aguardando 30 segundos para inicialização..."
sleep 30
echo ""

echo "6. Verificando status..."
docker logs evolution-api-ci --tail 20
echo ""

echo "========================================"
echo "  ✅ DEPLOY CONCLUÍDO!"
echo "========================================"
echo ""
echo "🌐 URLs de Acesso:"
echo "   - Evolution API: https://evolution.z7botsolutions.com.br"
echo "   - QR Code: https://evolution.z7botsolutions.com.br/instance/connect/securedguard"
echo "   - API Key: B6D711FCDE4D4FD5936544120E713976"
echo ""
echo "📋 Próximos passos:"
echo "   1. Criar instância: POST /instance/create"
echo "   2. Obter QR Code: GET /instance/connect/securedguard"
echo "   3. Escanear com WhatsApp: 31971731747"
echo ""

ENDSSH

echo ""
echo -e "${GREEN}========================================"
echo -e "  ✅ DEPLOY FINALIZADO COM SUCESSO!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}🌐 Acesse a Evolution API:${NC}"
echo "   https://evolution.z7botsolutions.com.br"
echo ""
echo -e "${YELLOW}📱 Para obter o QR Code:${NC}"
echo "   curl -H 'apikey: B6D711FCDE4D4FD5936544120E713976' https://evolution.z7botsolutions.com.br/instance/connect/securedguard"
echo ""

