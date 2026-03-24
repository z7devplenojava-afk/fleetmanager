@echo off
REM Script para executar a migration V338 manualmente no Windows
REM Uso: executar-migration-v338.bat

echo ==========================================
echo EXECUTAR MIGRATION V338
echo ==========================================
echo.

REM Configurações do banco (ajuste conforme necessário)
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=secured_guard
set DB_USER=postgres
set DB_PASSWORD=4KaCiJc6an@7sgbdcid2025

echo Configuracoes do banco:
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo    Database: %DB_NAME%
echo    User: %DB_USER%
echo.

REM Verificar se psql está instalado
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: psql nao esta instalado!
    echo    Instale o PostgreSQL client para executar este script.
    pause
    exit /b 1
)

echo Verificando se a tabela ja existe...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unification_jobs');" > temp_check.txt
set /p TABLE_EXISTS=<temp_check.txt
del temp_check.txt

if "%TABLE_EXISTS%"=="t" (
    echo A tabela 'unification_jobs' ja existe!
    echo.
    echo Estrutura da tabela:
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\d unification_jobs"
    pause
    exit /b 0
)

echo A tabela nao existe. Executando migration...
echo.

REM Executar a migration
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f backend\src\main\resources\db\migration\V338__create_unification_jobs_table.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration executada com sucesso!
    echo.
    echo Estrutura da tabela criada:
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\d unification_jobs"
    
    echo.
    echo Registrando no historico do Flyway...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) SELECT COALESCE(MAX(installed_rank), 0) + 1, '338', 'create unification jobs table', 'SQL', 'V338__create_unification_jobs_table.sql', 0, current_user, CURRENT_TIMESTAMP, 0, true FROM flyway_schema_history WHERE NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '338');"
    
    echo.
    echo Migration V338 concluida com sucesso!
) else (
    echo.
    echo ERRO ao executar a migration!
    pause
    exit /b 1
)

pause

