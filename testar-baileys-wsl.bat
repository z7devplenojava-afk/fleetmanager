@echo off
echo ========================================
echo Testando Baileys no WSL
echo ========================================
echo.

echo [1/3] Inicializando instancia...
curl -s http://localhost:3333/instance/init
echo.
echo.

echo Aguardando 15 segundos para gerar QR Code...
timeout /t 15 /nobreak >nul
echo.

echo [2/3] Verificando estado da conexao...
curl -s http://localhost:3333/instance/connectionState
echo.
echo.

echo [3/3] Buscando QR Code...
curl -s http://localhost:3333/instance/qr > qr-temp.json
type qr-temp.json
echo.
echo.

echo ========================================
echo Abra o arquivo: qrcode-baileys-wsl.html
echo ========================================
pause

