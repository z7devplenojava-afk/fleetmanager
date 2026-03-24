@echo off
echo ========================================
echo   EXECUTAR MIGRAÇÕES DO FLYWAY
echo ========================================
echo.

cd /d %~dp0

echo [1/3] Flyway INFO - Verificando migrações pendentes...
echo.
call mvnw.cmd flyway:info -Dflyway.configFiles=flyway.conf

echo.
echo [2/3] Flyway MIGRATE - Aplicando migrações...
echo.
call mvnw.cmd flyway:migrate -Dflyway.configFiles=flyway.conf

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   MIGRAÇÕES EXECUTADAS COM SUCESSO!
    echo ========================================
    echo.
    echo Tabelas criadas:
    echo   - vehicle_maintenances
    echo   - mileage_records
    echo   - cost_centers
    echo   - Outras pendentes
    echo.
    echo Reinicie o backend para aplicar as mudanças!
) else (
    echo.
    echo ERRO ao executar migrações!
    echo Verifique os logs acima.
)

echo.
pause

