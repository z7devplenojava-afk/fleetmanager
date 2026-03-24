@echo off
echo Compilando backend...
cd /d "%~dp0"
cd backend
mvnw.cmd clean install -DskipTests
cd ..
echo.
echo Pronto! Agora inicie o backend.
pause

