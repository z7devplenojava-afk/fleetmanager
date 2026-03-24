@echo off
echo.
echo ========================================
echo   REINICIAR DOCKER RAPIDAMENTE
echo ========================================
echo.

echo 1. Parando containers...
docker-compose down 2>nul

echo.
echo 2. Aguardando 5 segundos...
timeout /t 5 /nobreak >nul

echo.
echo 3. Iniciando containers...
docker-compose up -d

echo.
echo 4. Aguardando 30 segundos para inicializar...
timeout /t 30 /nobreak >nul

echo.
echo 5. Verificando status...
docker ps

echo.
echo ========================================
echo   PRONTO!
echo ========================================
echo.
echo Agora execute: powershell -ExecutionPolicy Bypass -File get-qr-rapido.ps1
echo.
pause

