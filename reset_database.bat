@echo off
chcp 65001 >nul
echo ════════════════════════════════════════════════════════
echo    RESET DO BANCO DE DADOS - SECURED GUARD
echo ════════════════════════════════════════════════════════
echo.
echo ⚠️  ATENÇÃO: Este script vai RESETAR TUDO no banco!
echo    Use apenas em ambiente de DESENVOLVIMENTO
echo.
pause
echo.

echo [1/3] Parando processos Java...
taskkill /F /IM java.exe >nul 2>&1
echo ✓ Processos parados
echo.

echo [2/3] Limpando pasta target...
if exist "backend\target" (
    rmdir /S /Q "backend\target"
    echo ✓ Target limpo
) else (
    echo ✓ Target já estava limpo
)
echo.

echo [3/3] Resetando banco de dados...
set PGPASSWORD=root
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -d secured_guard -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public; SELECT 'BANCO RESETADO!' as status;"
set PGPASSWORD=

if %errorlevel% equ 0 (
    echo.
    echo ════════════════════════════════════════════════════════
    echo ✓ SUCESSO! Banco resetado completamente!
    echo ════════════════════════════════════════════════════════
    echo.
    echo PRÓXIMO PASSO:
    echo 1. Inicie o backend na sua IDE
    echo 2. Aguarde as migrações executarem
    echo 3. Verifique o log para confirmar sucesso
    echo.
) else (
    echo.
    echo ════════════════════════════════════════════════════════
    echo ❌ ERRO ao resetar o banco!
    echo ════════════════════════════════════════════════════════
    echo.
    echo Possíveis causas:
    echo - PostgreSQL não está rodando
    echo - Senha incorreta (atual: root)
    echo - Banco de dados não existe
    echo.
    echo SOLUÇÃO ALTERNATIVA:
    echo Execute o arquivo RESET_BANCO_AGORA.sql no DBeaver/pgAdmin
    echo.
)

pause

