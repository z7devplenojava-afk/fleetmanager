@echo off
cd /d "%~dp0backend"
call mvnw.cmd clean compile -DskipTests
cd ..
echo.
echo Compilacao concluida! Agora inicie o backend.
pause

