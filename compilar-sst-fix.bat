@echo off
echo ========================================
echo Compilando correcao do modulo SST
echo ========================================
echo.

REM Navegar para o diretorio do backend
cd /d "%~dp0backend"

REM Usar o Maven do sistema ou o wrapper com aspas
if exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo Usando Maven do sistema...
    call "%MAVEN_HOME%\bin\mvn.cmd" clean compile -DskipTests
) else (
    echo Usando Maven wrapper...
    REM Tentar com o wrapper usando aspas no caminho
    cmd /c "mvnw.cmd clean compile -DskipTests"
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Compilacao concluida com sucesso!
    echo ========================================
    echo.
    echo Agora reinicie o backend para aplicar as mudancas.
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO na compilacao!
    echo ========================================
    echo.
    echo Tente reiniciar o backend pela sua IDE.
    echo As alteracoes ja foram salvas no arquivo:
    echo backend\src\main\java\com\z7design\secured_guard\controller\SSTController.java
    echo.
)

cd ..
pause
