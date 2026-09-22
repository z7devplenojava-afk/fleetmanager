@echo off
echo.
echo ========================================
echo   FLUXBUS - WSL UBUNTU
echo ========================================
echo.

echo 1. Copiando arquivos para WSL...
wsl -d Ubuntu-22.04 bash -c "mkdir -p ~/fluxbus"
wsl -d Ubuntu-22.04 bash -c "cp /mnt/c/dev/fluxbus/docker-compose.yml ~/fluxbus/"
wsl -d Ubuntu-22.04 bash -c "mkdir -p ~/fluxbus/backend/holerites/9-2025"

echo.
echo 2. Iniciando Docker no WSL...
wsl -d Ubuntu-22.04 -u root bash -c "service docker start >/dev/null 2>&1 || systemctl start docker >/dev/null 2>&1 || (nohup dockerd >/dev/null 2>&1 &)"
wsl -d Ubuntu-22.04 bash -c "docker info >/dev/null 2>&1 && echo 'Docker OK' || echo 'Docker NAO INICIOU'"

echo.
echo 3. Criando rede Docker...
wsl -d Ubuntu-22.04 bash -c "docker network create fluxbus 2>/dev/null || echo 'Rede OK'"

echo.
echo 4. Parando containers antigos...
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus && docker compose down"

echo.
echo 5. Iniciando servicos...
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus && docker compose up -d"

echo.
echo 6. Aguardando inicializacao (30 segundos)...
timeout /t 30 /nobreak >nul

echo.
echo 7. Verificando status...
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus && docker ps"

echo.
echo ========================================
echo   PRONTO!
echo ========================================
echo.
echo Agora execute: powershell -ExecutionPolicy Bypass -File get-qr-rapido.ps1
echo.
pause

