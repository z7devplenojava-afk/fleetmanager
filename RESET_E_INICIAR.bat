@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║           🔧 RESET COMPLETO - SECURED GUARD 🔧                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo [1/4] 🗑️  Limpando target antigas...
cd backend
if exist target\classes\db\migration (
    rmdir /s /q target\classes\db\migration
    echo ✅ Migrations antigas removidas!
) else (
    echo ⚠️  Diretório target\classes\db\migration não existe
)
cd ..

echo.
echo [2/4] 🔨 Recompilando projeto...
cd backend
call mvnw.cmd clean compile -DskipTests -q
if %ERRORLEVEL% EQU 0 (
    echo ✅ Compilação concluída!
) else (
    echo ❌ Erro na compilação!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] 🗄️  Resetando banco de dados...
echo.
echo ⚠️  ATENÇÃO: Isso vai APAGAR TODOS OS DADOS!
echo.
set /p CONFIRMA="Digite 'SIM' para continuar: "
if /I not "%CONFIRMA%"=="SIM" (
    echo ❌ Operação cancelada!
    pause
    exit /b 0
)

echo.
echo Executando reset no PostgreSQL...
psql -U postgres -h localhost -p 5432 -d secured_guard -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Banco resetado com sucesso!
) else (
    echo.
    echo ⚠️  Não consegui resetar automaticamente.
    echo.
    echo Execute manualmente no DBeaver:
    echo   DROP SCHEMA public CASCADE;
    echo   CREATE SCHEMA public;
    echo.
    pause
)

echo.
echo [4/4] ✅ PRONTO!
echo.
echo 📋 Próximos passos:
echo    1. Inicie o backend (F5 no Cursor)
echo    2. Aguarde as migrations executarem
echo    3. ✅ Sistema funcionando!
echo.
pause

