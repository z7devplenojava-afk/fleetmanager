@echo off
echo ========================================
echo CORRECAO: QR Code WhatsApp Baileys
echo ========================================
echo.

echo 1. Parando container do WhatsApp...
docker stop whatsapp-service
echo    OK
echo.

echo 2. Limpando sessoes antigas (corrompidas)...
if exist "whatsapp-service\sessions\securedguard" (
    rmdir /s /q "whatsapp-service\sessions\securedguard"
    echo    ✅ Sessoes removidas
) else (
    echo    ⚠️  Pasta de sessoes nao encontrada
)
echo.

echo 3. Recriando pasta de sessoes...
mkdir "whatsapp-service\sessions\securedguard" 2>nul
echo    OK
echo.

echo 4. Iniciando container do WhatsApp...
docker start whatsapp-service
echo    OK
echo.

echo 5. Aguardando 10 segundos para inicializacao...
timeout /t 10 /nobreak >nul
echo    OK
echo.

echo 6. Verificando logs...
docker logs whatsapp-service --tail 20
echo.

echo 7. Verificando status da conexao...
curl -s http://localhost:3333/health
echo.
echo.

echo ========================================
echo PROXIMOS PASSOS:
echo ========================================
echo.
echo 1. Acesse: http://localhost:3333/instance/qr
echo 2. Escaneie o QR Code com seu WhatsApp
echo 3. Aguarde a mensagem: "WhatsApp connected and ready!"
echo 4. Teste o envio de holerite
echo.
echo OU use o navegador:
echo    start http://localhost:3333/instance/qr
echo.
pause
