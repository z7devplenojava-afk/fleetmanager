#!/bin/bash

# Script de teste para envio de holerite via WhatsApp
# Uso: bash test-envio-whatsapp.sh

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
API_URL="${API_URL:-http://localhost:8080}"
TOKEN="${TOKEN:-}"
CPF_TESTE="${CPF_TESTE:-12345678900}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Teste de Envio de Holerite via WhatsApp             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Função para log
log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[→]${NC} $1"
}

# Verificar se TOKEN está definido
if [ -z "$TOKEN" ]; then
    log_error "TOKEN não definido!"
    echo ""
    echo "Configure o token de autenticação:"
    echo "  export TOKEN='seu_token_jwt'"
    echo ""
    echo "Ou faça login primeiro:"
    echo "  curl -X POST $API_URL/api/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"username\":\"seu_usuario\",\"password\":\"sua_senha\"}'"
    exit 1
fi

echo ""
log_step "Configurações:"
echo "  API URL: $API_URL"
echo "  CPF Teste: $CPF_TESTE"
echo ""

# Teste 1: Verificar se backend está rodando
log_step "Teste 1: Verificando backend..."
if curl -s -f "$API_URL/actuator/health" > /dev/null 2>&1; then
    log_info "Backend está rodando"
else
    log_error "Backend não está acessível em $API_URL"
    exit 1
fi

# Teste 2: Verificar se WhatsApp está cadastrado
log_step "Teste 2: Verificando WhatsApp cadastrado..."
WHATSAPP_RESPONSE=$(curl -s -X GET "$API_URL/api/envio/verificar-whatsapp/$CPF_TESTE" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

echo "  Resposta: $WHATSAPP_RESPONSE"

TEM_WHATSAPP=$(echo "$WHATSAPP_RESPONSE" | grep -o '"temWhatsApp":[^,}]*' | cut -d':' -f2)
NUMERO_WHATSAPP=$(echo "$WHATSAPP_RESPONSE" | grep -o '"numeroWhatsApp":"[^"]*"' | cut -d'"' -f4)

if [ "$TEM_WHATSAPP" == "true" ]; then
    log_info "WhatsApp cadastrado: $NUMERO_WHATSAPP"
else
    log_error "WhatsApp não cadastrado para CPF $CPF_TESTE"
    echo ""
    echo "Para cadastrar WhatsApp, execute:"
    echo "  UPDATE users SET whatsapp = '31971731747' WHERE username = '$CPF_TESTE';"
    exit 1
fi

# Teste 3: Verificar se Baileys está conectado
log_step "Teste 3: Verificando conexão Baileys..."
BAILEYS_URL="${BAILEYS_URL:-http://localhost:3333}"
if curl -s -f "$BAILEYS_URL/instance/connectionState?key=fluxbus" > /dev/null 2>&1; then
    BAILEYS_STATE=$(curl -s "$BAILEYS_URL/instance/connectionState?key=fluxbus")
    if echo "$BAILEYS_STATE" | grep -q "open"; then
        log_info "Baileys está conectado"
    else
        log_warn "Baileys não está conectado. Estado: $BAILEYS_STATE"
        echo ""
        echo "Para conectar o Baileys:"
        echo "  1. Acesse: $BAILEYS_URL/instance/qr?key=fluxbus"
        echo "  2. Escaneie o QR Code com WhatsApp"
    fi
else
    log_warn "Baileys não está acessível em $BAILEYS_URL"
fi

# Teste 4: Listar logs anteriores
log_step "Teste 4: Verificando logs anteriores..."
LOGS_RESPONSE=$(curl -s -X GET "$API_URL/api/envio/logs?cpf=$CPF_TESTE" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

LOGS_COUNT=$(echo "$LOGS_RESPONSE" | grep -o '"id"' | wc -l)
log_info "Encontrados $LOGS_COUNT logs anteriores"

if [ "$LOGS_COUNT" -gt 0 ]; then
    echo ""
    echo "  Últimos logs:"
    echo "$LOGS_RESPONSE" | jq -r '.[] | "    - \(.createdAt // "N/A") | \(.channel) | Sucesso: \(.success) | \(.errorMessage // "OK")"' 2>/dev/null || echo "    (instale jq para visualizar logs formatados)"
fi

# Teste 5: Envio individual (DRY RUN - apenas se confirmado)
echo ""
log_step "Teste 5: Envio individual"
echo ""
read -p "  Deseja enviar um holerite de teste para $NUMERO_WHATSAPP? (s/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    log_step "Enviando holerite via WhatsApp..."
    
    ENVIO_RESPONSE=$(curl -s -X POST "$API_URL/api/envio/individual" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"tipo\": \"whatsapp\",
            \"cpf\": \"$CPF_TESTE\",
            \"mensagem\": \"🧪 Teste de envio automático - $(date '+%Y-%m-%d %H:%M:%S')\"
        }")
    
    echo ""
    echo "  Resposta completa:"
    echo "$ENVIO_RESPONSE" | jq '.' 2>/dev/null || echo "$ENVIO_RESPONSE"
    echo ""
    
    SUCESSO=$(echo "$ENVIO_RESPONSE" | grep -o '"sucesso":[^,}]*' | cut -d':' -f2)
    
    if [ "$SUCESSO" == "true" ]; then
        log_info "Envio realizado com sucesso!"
        
        TOTAL_ENVIADOS=$(echo "$ENVIO_RESPONSE" | grep -o '"totalEnviados":[^,}]*' | cut -d':' -f2)
        log_info "Total enviados: $TOTAL_ENVIADOS"
        
        echo ""
        echo "  Verifique o WhatsApp $NUMERO_WHATSAPP para confirmar recebimento"
    else
        log_error "Falha no envio"
        
        MENSAGEM=$(echo "$ENVIO_RESPONSE" | grep -o '"mensagem":"[^"]*"' | cut -d'"' -f4)
        log_error "Mensagem: $MENSAGEM"
        
        # Mostrar detalhes do erro
        echo ""
        echo "  Detalhes:"
        echo "$ENVIO_RESPONSE" | jq '.detalhes[]' 2>/dev/null || echo "  (instale jq para ver detalhes)"
    fi
else
    log_warn "Envio cancelado pelo usuário"
fi

# Resumo final
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Resumo dos Testes                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  ✓ Backend: OK"
echo "  ✓ WhatsApp cadastrado: $NUMERO_WHATSAPP"
echo "  ✓ Logs anteriores: $LOGS_COUNT"
echo ""

# Comandos úteis
echo -e "${BLUE}Comandos úteis:${NC}"
echo ""
echo "  # Verificar logs do backend"
echo "  docker logs fluxbus-backend-ci --tail 50 | grep '📤\\|❌\\|✅'"
echo ""
echo "  # Verificar conexão Baileys"
echo "  curl $BAILEYS_URL/instance/connectionState?key=fluxbus"
echo ""
echo "  # Obter QR Code"
echo "  curl $BAILEYS_URL/instance/qr?key=fluxbus"
echo ""
echo "  # Listar todos os logs de envio"
echo "  curl -H 'Authorization: Bearer \$TOKEN' '$API_URL/api/envio/logs?cpf=$CPF_TESTE' | jq"
echo ""

log_info "Testes concluídos!"
