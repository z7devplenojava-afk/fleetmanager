@echo off
echo ================================================
echo   Compilando Backend - FluxBus
echo ================================================
echo.

cd backend
call mvnw.cmd clean compile -DskipTests

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   COMPILACAO CONCLUIDA COM SUCESSO!
    echo ================================================
    echo.
    echo Proximos passos:
    echo 1. Execute RESET_FINAL.sql no DBeaver
    echo 2. Inicie o backend no Cursor
    echo.
) else (
    echo.
    echo ================================================
    echo   ERRO NA COMPILACAO!
    echo ================================================
    echo.
)

cd ..
pause

