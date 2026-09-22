@echo off
echo ========================================
echo   BUILD EVOLUTION API COM CHROMIUM
echo ========================================
echo.

echo 1. Parando Evolution antiga...
docker-compose stop evolution-api
docker-compose rm -f evolution-api
echo    OK
echo.

echo 2. Removendo imagem antiga...
docker rmi evolution-api-chromium:local -f 2>nul
echo    OK
echo.

echo 3. Fazendo BUILD (vai demorar ~3-5 minutos)...
echo    Instalando Chromium e dependencias...
docker-compose build evolution-api
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Build falhou!
    pause
    exit /b 1
)
echo    ✅ Build concluido!
echo.

echo 4. Limpando volumes...
docker volume rm fluxbus_evolution_instances -f 2>nul
echo    OK
echo.

echo 5. Recriando banco...
docker exec fluxbus-db-local psql -U postgres -c "DROP DATABASE IF EXISTS evolution_db;" 2>nul
docker exec fluxbus-db-local psql -U postgres -c "CREATE DATABASE evolution_db;"
echo    OK
echo.

echo 6. Iniciando Evolution API com Chromium...
docker-compose up -d evolution-api
echo    OK
echo.

echo 7. Aguardando 45 segundos para inicializar...
timeout /t 45 /nobreak >nul
echo.

echo 8. Testando API...
curl -s http://localhost:9000 | findstr "Welcome" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Evolution API ONLINE!
) else (
    echo    ❌ Evolution API offline
    docker logs evolution-api --tail 30
    pause
    exit /b 1
)
echo.

echo 9. Verificando se Chromium foi instalado...
docker exec evolution-api which chromium
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Chromium INSTALADO!
) else (
    echo    ❌ Chromium NAO encontrado!
    pause
    exit /b 1
)
echo.

echo 10. Criando instancia...
curl -X POST http://localhost:9000/instance/create ^
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" ^
  -H "Content-Type: application/json" ^
  -d "{\"instanceName\":\"fluxbus\",\"integration\":\"WHATSAPP-BAILEYS\"}"
echo.
echo    OK
echo.

echo 11. Aguardando 20 segundos...
timeout /t 20 /nobreak >nul
echo.

echo 12. Verificando logs...
docker logs evolution-api --tail 20 | findstr /C:"ChannelStartupService" >nul
if %ERRORLEVEL% EQU 0 (
    for /f %%i in ('docker logs evolution-api --tail 20 ^| findstr /C:"ChannelStartupService" ^| find /c /v ""') do set LOOP_COUNT=%%i
    if %LOOP_COUNT% GTR 5 (
        echo    ❌ LOOP DETECTADO ^(%LOOP_COUNT% vezes^)
    ) else (
        echo    ✅ SEM LOOP ^(%LOOP_COUNT% vezes^)
    )
) else (
    echo    ✅ SEM LOOP!
)
echo.

echo 13. Obtendo QR Code...
curl -s -H "apikey: B6D711FCDE4D4FD5936544120E713976" ^
  http://localhost:9000/instance/connect/fluxbus > qr_response.json

echo.
type qr_response.json | findstr "code" >nul
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   ✅ QR CODE GERADO COM SUCESSO!
    echo ========================================
    echo.
    echo ACESSE PARA ESCANEAR:
    echo   http://localhost:9000/instance/connect/fluxbus
    echo.
    echo Header: apikey: B6D711FCDE4D4FD5936544120E713976
    echo Numero: 31971731747
    echo.
) else (
    echo ========================================
    echo   ❌ QR CODE VAZIO
    echo ========================================
    echo.
    echo Response:
    type qr_response.json
    echo.
)

del qr_response.json 2>nul
echo.
pause

