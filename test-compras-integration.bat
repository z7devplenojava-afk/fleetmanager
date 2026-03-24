@echo off
echo ========================================
echo TESTE DE INTEGRACAO - MODULO DE COMPRAS
echo ========================================
echo.

echo 1. Testando endpoint GET /api/purchase-requests
curl -X GET "http://localhost:8081/api/purchase-requests" ^
     -H "Authorization: Bearer %TOKEN%" ^
     -H "Content-Type: application/json"
echo.
echo.

echo 2. Testando endpoint GET /api/purchase-requests/urgent
curl -X GET "http://localhost:8081/api/purchase-requests/urgent" ^
     -H "Authorization: Bearer %TOKEN%" ^
     -H "Content-Type: application/json"
echo.
echo.

echo 3. Testando endpoint GET /api/purchase-requests/stats/count/PENDING
curl -X GET "http://localhost:8081/api/purchase-requests/stats/count/PENDING" ^
     -H "Authorization: Bearer %TOKEN%" ^
     -H "Content-Type: application/json"
echo.
echo.

echo 4. Criando uma requisicao de compra de teste
curl -X POST "http://localhost:8081/api/purchase-requests" ^
     -H "Authorization: Bearer %TOKEN%" ^
     -H "Content-Type: application/json" ^
     -d "{\"title\":\"Teste Compra\",\"description\":\"Requisicao de teste\",\"priority\":\"MEDIUM\",\"status\":\"SUBMITTED\",\"requesterName\":\"Usuario Teste\",\"department\":\"TI\",\"justification\":\"Teste de integracao\",\"estimatedTotal\":1000.00,\"urgency\":\"NORMAL\"}"
echo.
echo.

echo ========================================
echo TESTE CONCLUIDO
echo ========================================
pause