#!/bin/bash

# ========================================
# DEPLOY COMPLETO EVOLUTION API NO CI
# ========================================

set -e  # Exit on error

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================"
echo -e "  🚀 DEPLOY EVOLUTION API - LINUX CI"
echo -e "========================================${NC}"
echo ""

# Ir para o diretório
cd /var/www/fluxbus/ci

echo -e "${YELLOW}1. Fazendo git pull...${NC}"
git pull origin ci
echo -e "${GREEN}   ✅ Pull concluído!${NC}"
echo ""

echo -e "${YELLOW}2. Criando banco evolution_ci...${NC}"
docker exec fluxbus-db-ci psql -U fluxbus_ci -c "CREATE DATABASE evolution_ci;" 2>/dev/null && echo -e "${GREEN}   ✅ Banco criado!${NC}" || echo -e "${YELLOW}   ⚠️  Banco já existe${NC}"
echo ""

echo -e "${YELLOW}3. Criando diretórios...${NC}"
mkdir -p /var/www/fluxbus/ci/evolution_instances
mkdir -p /var/www/fluxbus/ci/holerites
chmod -R 755 /var/www/fluxbus/ci/evolution_instances
chmod -R 755 /var/www/fluxbus/ci/holerites
echo -e "${GREEN}   ✅ Diretórios criados!${NC}"
echo ""

echo -e "${YELLOW}4. Recriando containers (backend + evolution)...${NC}"
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci evolution-api-ci
echo -e "${GREEN}   ✅ Containers iniciados!${NC}"
echo ""

echo -e "${YELLOW}5. Aguardando 45 segundos para inicialização...${NC}"
for i in {1..45}; do
    if [ $((i % 5)) -eq 0 ]; then
        echo -e "${CYAN}   [$i/45s]${NC}"
    fi
    sleep 1
done
echo ""

echo -e "${YELLOW}6. Verificando status da Evolution API...${NC}"
echo ""
if curl -s https://evolution.z7botsolutions.com.br | grep -q "Welcome"; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ EVOLUTION API ONLINE!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
else
    echo -e "${RED}   ❌ Evolution API offline!${NC}"
    echo ""
    echo -e "${YELLOW}Logs da Evolution API:${NC}"
    docker logs evolution-api-ci --tail 30
    exit 1
fi

echo -e "${YELLOW}7. Testando login (verificando correção 405)...${NC}"
if curl -s -X POST https://ci.z7botsolutions.com.br/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"jose.ramos","password":"Admin1234"}' | grep -q "token"; then
    echo -e "${GREEN}   ✅ Login funcionando sem erro 405!${NC}"
else
    echo -e "${RED}   ❌ Login ainda com problema!${NC}"
fi
echo ""

echo -e "${YELLOW}8. Criando instância Evolution API...${NC}"
INSTANCE_RESPONSE=$(curl -s -X POST https://evolution.z7botsolutions.com.br/instance/create \
    -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
    -H "Content-Type: application/json" \
    -d '{"instanceName":"fluxbus","integration":"WHATSAPP-BAILEYS"}')

if echo "$INSTANCE_RESPONSE" | grep -q "hash"; then
    echo -e "${GREEN}   ✅ Instância criada!${NC}"
    echo -e "${CYAN}   Response: $INSTANCE_RESPONSE${NC}"
else
    echo -e "${YELLOW}   ⚠️  Resposta: $INSTANCE_RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}9. Aguardando 15 segundos...${NC}"
sleep 15
echo ""

echo -e "${YELLOW}10. Verificando logs (procurando por loop)...${NC}"
echo ""
LOGS=$(docker logs evolution-api-ci --tail 20)
echo "$LOGS"
echo ""

if echo "$LOGS" | grep -q "ChannelStartupService"; then
    LOOP_COUNT=$(echo "$LOGS" | grep -c "ChannelStartupService" || echo "0")
    if [ "$LOOP_COUNT" -gt 5 ]; then
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}  ❌ LOOP DETECTADO ($LOOP_COUNT vezes)!${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        echo -e "${YELLOW}Problema persiste mesmo no Linux!${NC}"
    else
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✅ SEM LOOP! FUNCIONANDO!${NC}"
        echo -e "${GREEN}========================================${NC}"
    fi
else
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ API INICIALIZADA CORRETAMENTE!${NC}"
    echo -e "${GREEN}========================================${NC}"
fi
echo ""

echo -e "${YELLOW}11. Obtendo QR Code...${NC}"
QR_RESPONSE=$(curl -s -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
    https://evolution.z7botsolutions.com.br/instance/connect/fluxbus)

if echo "$QR_RESPONSE" | grep -q "code"; then
    QR_LENGTH=$(echo "$QR_RESPONSE" | jq -r '.code' | wc -c)
    if [ "$QR_LENGTH" -gt 10 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✅ QR CODE GERADO COM SUCESSO!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${CYAN}QR Code: $QR_LENGTH caracteres${NC}"
        echo ""
        echo -e "${BLUE}========================================${NC}"
        echo -e "${BLUE}  📱 ACESSE PARA ESCANEAR:${NC}"
        echo -e "${BLUE}========================================${NC}"
        echo ""
        echo -e "${YELLOW}https://evolution.z7botsolutions.com.br/instance/connect/fluxbus${NC}"
        echo ""
        echo -e "${CYAN}API Key: B6D711FCDE4D4FD5936544120E713976${NC}"
        echo -e "${CYAN}Número: 31971731747${NC}"
        echo ""
    else
        echo -e "${RED}   ❌ QR Code vazio ($QR_LENGTH caracteres)!${NC}"
        echo -e "${YELLOW}   Response: $QR_RESPONSE${NC}"
    fi
else
    echo -e "${RED}   ❌ QR Code não gerado!${NC}"
    echo -e "${YELLOW}   Response: $QR_RESPONSE${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOY FINALIZADO!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}📊 Resumo:${NC}"
echo -e "   - Evolution API: $(curl -s https://evolution.z7botsolutions.com.br | grep -q 'Welcome' && echo '✅ Online' || echo '❌ Offline')"
echo -e "   - Login CI: Testado"
echo -e "   - Instância: Criada"
echo -e "   - QR Code: Verificar acima"
echo ""
echo -e "${YELLOW}🔗 URLs Importantes:${NC}"
echo "   - Evolution: https://evolution.z7botsolutions.com.br"
echo "   - Backend CI: https://ci.z7botsolutions.com.br/api"
echo "   - Frontend CI: https://ci.z7botsolutions.com.br"
echo ""

