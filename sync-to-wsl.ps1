# Secured Guard - Sync Windows to WSL
# ============================================

Write-Host "Sincronizando arquivos para WSL..." -ForegroundColor Cyan

# Criar pasta scripts no WSL se nao existir
wsl bash -c "mkdir -p ~/secured-guard/scripts"
wsl bash -c "mkdir -p ~/secured-guard/backend"
wsl bash -c "mkdir -p ~/secured-guard/frontend/nginx"
wsl bash -c "mkdir -p ~/secured-guard/.github/workflows"

# Copiar Dockerfiles
Write-Host "Copiando Dockerfiles..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/secured-guard/backend/Dockerfile.local ~/secured-guard/backend/"
wsl bash -c "cp /mnt/c/dev/secured-guard/backend/Dockerfile.prod ~/secured-guard/backend/"
wsl bash -c "cp /mnt/c/dev/secured-guard/frontend/Dockerfile.local ~/secured-guard/frontend/"
wsl bash -c "cp /mnt/c/dev/secured-guard/frontend/Dockerfile.prod ~/secured-guard/frontend/"

# Copiar nginx
Write-Host "Copiando nginx..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/secured-guard/frontend/nginx/nginx.conf ~/secured-guard/frontend/nginx/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/secured-guard/frontend/nginx/default.conf ~/secured-guard/frontend/nginx/ 2>/dev/null || true"

# Copiar whatsapp-service
Write-Host "Copiando whatsapp-service..." -ForegroundColor Yellow
wsl bash -c "cp -r /mnt/c/dev/secured-guard/whatsapp-service ~/secured-guard/ 2>/dev/null || true"

# Copiar Docker Compose files
Write-Host "Copiando Docker Compose files..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/secured-guard/docker-compose.local.yml ~/secured-guard/"
wsl bash -c "cp /mnt/c/dev/secured-guard/docker-compose.test.yml ~/secured-guard/"
wsl bash -c "cp /mnt/c/dev/secured-guard/docker-compose.prod.yml ~/secured-guard/"

# Copiar scripts
Write-Host "Copiando scripts..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/secured-guard/scripts/start-local.sh ~/secured-guard/scripts/"
wsl bash -c "cp /mnt/c/dev/secured-guard/scripts/start-local.ps1 ~/secured-guard/scripts/"

# Copiar templates
Write-Host "Copiando templates..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/secured-guard/env.local.template ~/secured-guard/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/secured-guard/env.prod.template ~/secured-guard/ 2>/dev/null || true"

# Copiar documentacao
Write-Host "Copiando documentacao..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/secured-guard/QUICK_START.md ~/secured-guard/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/secured-guard/README_ENVIRONMENTS.md ~/secured-guard/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/secured-guard/WSL_SETUP_GUIDE.md ~/secured-guard/ 2>/dev/null || true"
wsl bash -c "cp /mnt/c/dev/secured-guard/IMPLEMENTACAO_COMPLETA.md ~/secured-guard/ 2>/dev/null || true"

# Copiar package-lock.json
Write-Host "Copiando package-lock.json..." -ForegroundColor Yellow
wsl bash -c "cp /mnt/c/dev/secured-guard/frontend/package-lock.json ~/secured-guard/frontend/"

# Ajustar permissoes
Write-Host "Ajustando permissoes..." -ForegroundColor Yellow
wsl bash -c "chmod +x ~/secured-guard/scripts/*.sh"

Write-Host ""
Write-Host "Sincronizacao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximo passo no WSL:" -ForegroundColor Cyan
Write-Host "   cd ~/secured-guard && ./scripts/start-local.sh" -ForegroundColor White
Write-Host ""
