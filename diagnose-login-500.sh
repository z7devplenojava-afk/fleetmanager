#!/bin/bash

# Script completo para diagnosticar erro 500 no login
# Execute na VPS: bash diagnose-login-500.sh

echo "🔍 =========================================="
echo "🔍 DIAGNÓSTICO DE ERRO 500 NO LOGIN"
echo "🔍 =========================================="
echo ""

echo "📋 1. Verificando se o backend está rodando..."
docker ps | grep fluxbus-backend-ci

echo ""
echo "📋 2. Últimas 100 linhas dos logs do backend (filtrado por erros)..."
docker logs --tail=100 fluxbus-backend-ci 2>&1 | grep -i -E "(login|auth|error|exception|500|nullpointer)" | tail -50

echo ""
echo "📋 3. Últimas 50 linhas completas dos logs do backend..."
docker logs --tail=50 fluxbus-backend-ci 2>&1 | tail -50

echo ""
echo "📋 4. Testando endpoint de login diretamente no backend..."
docker exec fluxbus-backend-ci curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v 2>&1 | head -50

echo ""
echo "📋 5. Verificando health do backend..."
docker exec fluxbus-backend-ci curl -s http://localhost:8081/api/health 2>&1

echo ""
echo "📋 6. Verificando variável de ambiente JWT_SECRET..."
docker exec fluxbus-backend-ci printenv | grep -i jwt

echo ""
echo "📋 7. Verificando se o banco de dados está acessível..."
docker exec fluxbus-backend-ci curl -s http://localhost:8081/api/health | jq . 2>/dev/null || docker exec fluxbus-backend-ci curl -s http://localhost:8081/api/health

echo ""
echo "📋 8. Procurando por erros específicos de JWT..."
docker logs --tail=200 fluxbus-backend-ci 2>&1 | grep -i -E "(jwt|token|signing|secret)" | tail -20

echo ""
echo "📋 9. Procurando por erros de roles..."
docker logs --tail=200 fluxbus-backend-ci 2>&1 | grep -i -E "(role|roles|authority)" | tail -20

echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "💡 Dica: Se encontrar erros, verifique:"
echo "   - Se o JWT_SECRET está configurado corretamente"
echo "   - Se o usuário tem roles cadastradas no banco"
echo "   - Se há problemas de conexão com o banco de dados"

