#!/bin/bash

# Script para verificar erro 500 no login
# Execute na VPS: bash check-login-error.sh

echo "🔍 Verificando erro 500 no login..."

echo ""
echo "📋 1. Últimas 50 linhas dos logs do backend (procurando por erros de login)..."
docker logs --tail=50 secured-guard-backend-ci | grep -i -E "(login|auth|error|exception|500)" | tail -30

echo ""
echo "📋 2. Testando endpoint de login diretamente..."
docker exec secured-guard-backend-ci curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v 2>&1 | head -40

echo ""
echo "📋 3. Verificando se o banco de dados está acessível..."
docker exec secured-guard-backend-ci curl -s http://localhost:8081/api/health | jq . || docker exec secured-guard-backend-ci curl -s http://localhost:8081/api/health

echo ""
echo "📋 4. Verificando logs completos do backend (últimas 100 linhas)..."
docker logs --tail=100 secured-guard-backend-ci | tail -50

echo ""
echo "✅ Verificação concluída!"

