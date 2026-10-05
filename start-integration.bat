@echo off
echo ========================================
echo    Iniciando FluxBus Integration
echo ========================================
echo.

echo [1/3] Verificando se o backend esta rodando...
netstat -an | findstr :8081 > nul
if %errorlevel% equ 0 (
    echo Backend ja esta rodando na porta 8081
) else (
    echo Iniciando backend...
    start "Backend - FluxBus" cmd /k "cd backend && mvn spring-boot:run -DskipTests"
    timeout /t 5 /nobreak > nul
)

echo.
echo [2/3] Verificando se o frontend esta rodando...
netstat -an | findstr :5173 > nul
if %errorlevel% equ 0 (
    echo Frontend ja esta rodando na porta 5173
) else (
    echo Iniciando frontend...
    start "Frontend - FluxBus" cmd /k "cd frontend && npm run dev"
    timeout /t 3 /nobreak > nul
)

echo.
echo [3/3] Verificando status dos servicos...
echo.
echo Backend:  http://localhost:8081
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8081/swagger-ui/index.html
echo.
echo ========================================
echo    Servicos iniciados com sucesso!
echo ========================================
echo.
echo Pressione qualquer tecla para abrir o frontend no navegador...
pause > nul
start http://localhost:5173 