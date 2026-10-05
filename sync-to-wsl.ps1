# FluxBus - Sync Windows to WSL
# ============================================

Write-Host "Sincronizando arquivos para WSL..." -ForegroundColor Cyan

# Criar pasta scripts no WSL se nao existir
wsl bash -c "mkdir -p ~/fluxbus/scripts"
wsl bash -c "mkdir -p ~/fluxbus/backend"
wsl bash -c "mkdir -p ~/fluxbus/frontend/nginx"
wsl bash -c "mkdir -p ~/fluxbus/.github/workflows"

# Copiar Dockerfiles
Write-Host "Copiando Dockerfiles..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/fluxbus/backend/Dockerfile.local ~/fluxbus/backend/"
wsl bash -c "cp /mnt/c/dev/fluxbus/backend/Dockerfile.prod ~/fluxbus/backend/"
wsl bash -c "cp /mnt/c/dev/fluxbus/frontend/Dockerfile.local ~/fluxbus/frontend/"
wsl bash -c "cp /mnt/c/dev/fluxbus/frontend/Dockerfile.prod ~/fluxbus/frontend/"

# Copiar nginx
Write-Host "Copiando nginx..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/fluxbus/frontend/nginx/nginx.conf ~/fluxbus/frontend/nginx/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/fluxbus/frontend/nginx/default.conf ~/fluxbus/frontend/nginx/ 2>/dev/null || true"

# Copiar whatsapp-service
Write-Host "Copiando whatsapp-service..." -ForegroundColor Yellow
wsl bash -c "cp -r /mnt/c/dev/fluxbus/whatsapp-service ~/fluxbus/ 2>/dev/null || true"

# Copiar Docker Compose files
Write-Host "Copiando Docker Compose files..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/fluxbus/docker-compose.local.yml ~/fluxbus/"
wsl bash -c "cp /mnt/c/dev/fluxbus/docker-compose.test.yml ~/fluxbus/"
wsl bash -c "cp /mnt/c/dev/fluxbus/docker-compose.prod.yml ~/fluxbus/"

# Copiar scripts
Write-Host "Copiando scripts..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/fluxbus/scripts/start-local.sh ~/fluxbus/scripts/"
wsl bash -c "cp /mnt/c/dev/fluxbus/scripts/start-local.ps1 ~/fluxbus/scripts/"

# Copiar templates
Write-Host "Copiando templates..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/fluxbus/env.local.template ~/fluxbus/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/fluxbus/env.prod.template ~/fluxbus/ 2>/dev/null || true"

# Copiar documentacao
Write-Host "Copiando documentacao..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/fluxbus/QUICK_START.md ~/fluxbus/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/fluxbus/README_ENVIRONMENTS.md ~/fluxbus/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/fluxbus/WSL_SETUP_GUIDE.md ~/fluxbus/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/fluxbus/IMPLEMENTACAO_COMPLETA.md ~/fluxbus/ 2>/dev/null || true"

# Copiar package-lock.json
Write-Host "Copiando package-lock.json..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/fluxbus/frontend/package-lock.json ~/fluxbus/frontend/"

# Ajustar permissoes
Write-Host "Ajustando permissoes..." -ForegroundColor Yellow
wsl bash -c "chmod +x ~/fluxbus/scripts/*.sh"

Write-Host ""
Write-Host "Sincronizacao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximo passo no WSL:" -ForegroundColor Cyan
Write-Host "   cd ~/fluxbus && ./scripts/start-local.sh" -ForegroundColor White
Write-Host ""
