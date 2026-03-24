@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║   RESTAURANDO BACKEND - Secured Guard                     ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0backend"

echo [1/1] Recompilando o projeto...
echo.

call mvnw.cmd clean install -DskipTests

if %errorlevel% equ 0 (
    cd ..
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║   ✓ BACKEND RESTAURADO COM SUCESSO!                       ║
    echo ╚═══════════════════════════════════════════════════════════╝
    echo.
    echo O backend está pronto para executar!
    echo.
    echo PRÓXIMOS PASSOS:
    echo 1. Inicie o backend no Cursor (F5 ou botão Run)
    echo 2. Ele deve iniciar normalmente agora
    echo.
    echo Obs: Os problemas de migração ainda existem no banco.
    echo      Se der erro de migração, execute RESET_FINAL.sql
    echo.
) else (
    cd ..
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║   ✗ ERRO AO COMPILAR                                      ║
    echo ╚═══════════════════════════════════════════════════════════╝
    echo.
    echo Por favor, compile manualmente no Cursor:
    echo 1. Terminal: Ctrl + Shift + ^'
    echo 2. cd backend
    echo 3. .\mvnw.cmd clean install -DskipTests
    echo.
)

pause

