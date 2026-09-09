#!/bin/bash
# ============================================================
# Script de teste do módulo Lavajato
# Execute com o backend rodando em http://localhost:8081
# ============================================================

BASE_URL="http://localhost:8081/api/frota/lavajato"

# Substitua pelo token JWT de um usuário autenticado
TOKEN="${JWT_TOKEN:-SEU_TOKEN_JWT_AQUI}"

# IDs de teste (substitua por IDs reais do seu banco)
VEHICLE_ID="${VEHICLE_ID:-}"
DRIVER_ID="${DRIVER_ID:-}"
DRIVER_PHONE="${DRIVER_PHONE:-11999998888}"

echo "============================================="
echo "  TESTE DO MÓDULO LAVAJATO"
echo "============================================="

# 1) Listar registros (deve retornar vazio ou lista existente)
echo ""
echo ">>> 1) GET /api/frota/lavajato — Listar registros"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL" | head -50

# 2) Criar novo registro de lavajato
echo ""
echo ">>> 2) POST /api/frota/lavajato — Criar registro"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicleId\": \"$VEHICLE_ID\",
    \"driverId\": \"$DRIVER_ID\",
    \"driverPhone\": \"$DRIVER_PHONE\",
    \"observations\": \"Lavagem completa antes da viagem das 14h\"
  }" \
  "$BASE_URL")

echo "$RESPONSE" | sed 's/HTTP_STATUS:.*//'
HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:.*' | cut -d: -f2)
echo "HTTP Status: $HTTP_STATUS"

# Extrair ID do registro criado
SERVICE_ID=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:.*//' | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
echo "ID do registro: $SERVICE_ID"

if [ -z "$SERVICE_ID" ]; then
  echo "❌ Não foi possível criar registro. Verifique se o VEHICLE_ID está definido."
  exit 1
fi

# 3) Buscar registro por ID
echo ""
echo ">>> 3) GET /api/frota/lavajato/$SERVICE_ID — Buscar por ID"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$SERVICE_ID" | head -50

# 4) Iniciar serviço (muda status para IN_PROGRESS, inicia cronômetro)
echo ""
echo ">>> 4) POST /api/frota/lavajato/$SERVICE_ID/start — Iniciar serviço"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$SERVICE_ID/start" | head -50

# 5) Atualizar checklist interno
echo ""
echo ">>> 5) PUT /api/frota/lavajato/$SERVICE_ID/checklist-internal — Atualizar checklist interno"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checklistData": "[{\"key\":\"bancos\",\"title\":\"Limpeza dos Bancos\",\"checked\":true,\"photoUrl\":null},{\"key\":\"painel\",\"title\":\"Limpeza do Painel\",\"checked\":true,\"photoUrl\":null},{\"key\":\"tapetes\",\"title\":\"Limpeza dos Tapetes\",\"checked\":false,\"photoUrl\":null},{\"key\":\"vidros-internos\",\"title\":\"Limpeza dos Vidros Internos\",\"checked\":false,\"photoUrl\":null},{\"key\":\"porta-malas\",\"title\":\"Limpeza do Porta-malas\",\"checked\":false,\"photoUrl\":null}]"
  }' \
  "$BASE_URL/$SERVICE_ID/checklist-internal" | head -50

# 6) Atualizar checklist externo
echo ""
echo ">>> 6) PUT /api/frota/lavajato/$SERVICE_ID/checklist-external — Atualizar checklist externo"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checklistData": "[{\"key\":\"lavagem-carroceria\",\"title\":\"Lavagem da Carroceria\",\"checked\":true,\"photoUrl\":null},{\"key\":\"chapas\",\"title\":\"Limpeza das Chapas\",\"checked\":true,\"photoUrl\":null},{\"key\":\"rodas\",\"title\":\"Limpeza das Rodas\",\"checked\":false,\"photoUrl\":null},{\"key\":\"pneus\",\"title\":\"Pretinho nos Pneus\",\"checked\":false,\"photoUrl\":null},{\"key\":\"vidros-externos\",\"title\":\"Limpeza dos Vidros Externos\",\"checked\":false,\"photoUrl\":null}]"
  }' \
  "$BASE_URL/$SERVICE_ID/checklist-external" | head -50

# 7) Finalizar serviço (calcula duração + notifica motorista)
echo ""
echo ">>> 7) POST /api/frota/lavajato/$SERVICE_ID/complete — Finalizar e notificar"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$SERVICE_ID/complete" | head -50

# 8) Listar registros com filtro de status
echo ""
echo ">>> 8) GET /api/frota/lavajato?status=COMPLETED — Filtrar por status"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL?status=COMPLETED" | head -50

# 9) Excluir registro
echo ""
echo ">>> 9) DELETE /api/frota/lavajato/$SERVICE_ID — Excluir registro"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$SERVICE_ID"

# 10) Verificar exclusão
echo ""
echo ">>> 10) GET /api/frota/lavajato/$SERVICE_ID — Verificar exclusão (deve retornar 404)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/$SERVICE_ID" | head -20

echo ""
echo "============================================="
echo "  TESTES CONCLUÍDOS"
echo "============================================="
