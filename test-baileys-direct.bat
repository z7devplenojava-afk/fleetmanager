@echo off
echo ========================================
echo TESTE: Baileys sem Proxy/Firewall
echo ========================================
echo.

echo 1. Parando container atual...
docker stop whatsapp-service
docker rm whatsapp-service
echo    OK
echo.

echo 2. Limpando sessoes...
rmdir /s /q "whatsapp-service\sessions\securedguard" 2>nul
mkdir "whatsapp-service\sessions\securedguard"
echo    OK
echo.

echo 3. Iniciando container com network host (bypass proxy)...
docker run -d ^
  --name whatsapp-service ^
  --network host ^
  -v "%CD%\whatsapp-service\sessions:/app/sessions" ^
  -v "%CD%\backend\holerites:/app/holerites" ^
  -e PORT=3333 ^
  secured-guard-whatsapp
echo    OK
echo.

echo 4. Aguardando 15 segundos...
timeout /t 15 /nobreak >nul
echo    OK
echo.

echo 5. Verificando logs...
docker logs whatsapp-service --tail 30
echo.

echo ========================================
echo VERIFICAR:
echo ========================================
echo.
echo Se ainda der erro 405:
echo   - Pode ser firewall corporativo
echo   - Pode ser antivirus bloqueando
echo   - Pode ser ISP bloqueando WhatsApp Web
echo.
echo Tente:
echo   1. Desabilitar antivirus temporariamente
echo   2. Usar VPN
echo   3. Usar outro computador/rede
echo.
pause
