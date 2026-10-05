#!/bin/bash

# Script rápido para verificar logs de erro
# Execute na VPS: bash quick-check-logs.sh

echo "🔍 Verificando erros recentes no backend..."
echo ""

# Comando completo para verificar logs
docker logs --tail=100 fluxbus-backend-ci 2>&1 | grep -i -E "(login|auth|error|exception|500|nullpointer|jwt|token)" | tail -30

echo ""
echo "📋 Últimas 20 linhas de log (sem filtro)..."
docker logs --tail=20 fluxbus-backend-ci 2>&1

