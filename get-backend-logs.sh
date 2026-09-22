#!/bin/bash

# Script para obter logs detalhados do backend
# Execute na VPS: bash get-backend-logs.sh

echo "🔍 =========================================="
echo "🔍 LOGS DO BACKEND - ERRO 500 NO LOGIN"
echo "🔍 =========================================="
echo ""

echo "📋 Últimas 200 linhas dos logs (com todas as informações)..."
echo "=========================================="
docker logs --tail=200 fluxbus-backend-ci 2>&1

echo ""
echo ""
echo "📋 Filtrando apenas erros e exceções..."
echo "=========================================="
docker logs --tail=200 fluxbus-backend-ci 2>&1 | grep -i -E "(error|exception|failed|❌|💥)" | tail -50

echo ""
echo ""
echo "📋 Filtrando logs de login..."
echo "=========================================="
docker logs --tail=200 fluxbus-backend-ci 2>&1 | grep -i -E "(login|auth|authenticate)" | tail -50

echo ""
echo ""
echo "📋 Testando login diretamente..."
echo "=========================================="
docker exec fluxbus-backend-ci curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  2>&1

