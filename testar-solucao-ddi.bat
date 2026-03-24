@echo off
echo ========================================
echo   TESTANDO SOLUCAO DDI 55
echo ========================================
echo.

echo 1. Parando backend...
taskkill /F /FI "WINDOWTITLE eq backend*" 2>nul
timeout /t 3 /nobreak >nul
echo    OK
echo.

echo 2. Recompilando backend com correcao DDI...
cd backend
call mvnw.cmd clean compile -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Compilacao falhou!
    pause
    exit /b 1
)
echo    ✅ Backend recompilado!
cd ..
echo.

echo 3. Garantindo Baileys rodando...
docker-compose up -d whatsapp
timeout /t 10 /nobreak >nul
echo    OK
echo.

echo 4. Verificando conexao Baileys...
curl -s http://localhost:3333/health | findstr "ready" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Baileys CONECTADO!
) else (
    echo    ⚠️  Baileys nao conectado
    echo    Acesse: http://localhost:3333/qrcode?key=securedguard
    echo    Escaneie com WhatsApp: 31971731747
    echo.
    pause
    exit /b 1
)
echo.

echo 5. Iniciando backend...
echo    Aguarde ~30 segundos...
start "backend" cmd /c "cd backend && mvnw.cmd spring-boot:run"
timeout /t 35 /nobreak >nul
echo    OK
echo.

echo 6. Testando backend...
curl -s http://localhost:8081/api/health >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Backend ONLINE!
) else (
    echo    ❌ Backend offline
    pause
    exit /b 1
)
echo.

echo ========================================
echo   PRONTO PARA TESTAR!
echo ========================================
echo.
echo Agora teste o envio de holerite:
echo.
echo   POST http://localhost:8081/api/envio/individual
echo   {
echo     "cpf": "00824310608",
echo     "tipo": "whatsapp"
echo   }
echo.
echo Verifique nos logs se aparece:
echo   "📞 Numero normalizado: 31971731747 -^> 5531971731747"
echo.
echo E confirme se a mensagem chegou no DESTINATARIO CORRETO!
echo.
pause

