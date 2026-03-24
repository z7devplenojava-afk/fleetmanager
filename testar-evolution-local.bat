@echo off
echo ========================================
echo   TESTANDO EVOLUTION API LOCALMENTE
echo ========================================
echo.

echo 1. Parando Evolution antiga...
docker-compose stop evolution-api
docker-compose rm -f evolution-api
echo    OK
echo.

echo 2. Limpando volumes...
docker volume rm secured-guard_evolution_instances -f 2>nul
echo    OK
echo.

echo 3. Recriando banco evolution_db...
docker exec secured-guard-db-local psql -U postgres -c "DROP DATABASE IF EXISTS evolution_db;" 2>nul
docker exec secured-guard-db-local psql -U postgres -c "CREATE DATABASE evolution_db;"
echo    OK
echo.

echo 4. Iniciando Evolution API com correcoes...
docker-compose up -d evolution-api
echo    OK
echo.

echo 5. Aguardando 40 segundos para inicializar...
timeout /t 40 /nobreak >nul
echo.

echo 6. Testando API...
curl -s http://localhost:9000 | findstr "Welcome" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Evolution API ONLINE!
) else (
    echo    ❌ Evolution API offline
    echo.
    echo Verificando logs...
    docker logs evolution-api --tail 30
    pause
    exit /b 1
)
echo.

echo 7. Criando instancia...
curl -X POST http://localhost:9000/instance/create ^
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" ^
  -H "Content-Type: application/json" ^
  -d "{\"instanceName\":\"securedguard\",\"integration\":\"WHATSAPP-BAILEYS\"}"
echo    OK
echo.

echo 8. Aguardando 15 segundos...
timeout /t 15 /nobreak >nul
echo.

echo 9. Verificando logs (procurando por loop)...
docker logs evolution-api --tail 30 | findstr /C:"ChannelStartupService" >nul
if %ERRORLEVEL% EQU 0 (
    for /f %%i in ('docker logs evolution-api --tail 30 ^| findstr /C:"ChannelStartupService" ^| find /c /v ""') do set LOOP_COUNT=%%i
    if %LOOP_COUNT% GTR 5 (
        echo    ❌ LOOP DETECTADO ^(%LOOP_COUNT% vezes^)
    ) else (
        echo    ✅ SEM LOOP ^(%LOOP_COUNT% vezes^)
    )
) else (
    echo    ✅ SEM LOOP!
)
echo.

echo 10. Obtendo QR Code...
curl -s -H "apikey: B6D711FCDE4D4FD5936544120E713976" ^
  http://localhost:9000/instance/connect/securedguard > qr_response.json

echo.
echo ========================================
echo   RESULTADO
echo ========================================
echo.

type qr_response.json | findstr "code" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ QR CODE GERADO!
    echo.
    echo ACESSE:
    echo   http://localhost:9000/instance/connect/securedguard
    echo.
    echo Header: apikey: B6D711FCDE4D4FD5936544120E713976
    echo Numero: 31971731747
) else (
    echo ❌ QR CODE VAZIO
    echo.
    echo Response:
    type qr_response.json
    echo.
    echo.
    echo Verificando se Chromium esta instalado...
    docker exec evolution-api which google-chrome-stable
    if %ERRORLEVEL% NEQ 0 (
        echo    ❌ Chromium NAO instalado na imagem!
        echo.
        echo SOLUCAO: A imagem nao tem Chromium.
        echo Precisa usar uma imagem diferente ou Meta Cloud API.
    )
)

echo.
del qr_response.json 2>nul
echo.
pause

