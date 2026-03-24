# PowerShell Script para Deploy da Correção do JWT no CI
# Execute este script no seu computador Windows

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ci.z7botsolutions.com.br",
    [string]$ProjectPath = "/var/www/secured_guard"
)

Write-Host "=== DEPLOY CORREÇÃO JWT - CI ===" -ForegroundColor Cyan
Write-Host ""

# 1. Upload dos arquivos corrigidos
Write-Host "1. Enviando arquivos corrigidos..." -ForegroundColor Yellow
scp deploy/env.ci "${ServerUser}@${ServerHost}:${ProjectPath}/deploy/"
scp deploy/diagnose-login-error.sh "${ServerUser}@${ServerHost}:${ProjectPath}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar arquivos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos enviados com sucesso" -ForegroundColor Green
Write-Host ""

# 2. Reiniciar backend para aplicar alterações
Write-Host "2. Reiniciando backend no servidor..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerHost}" @"
cd ${ProjectPath}
chmod +x diagnose-login-error.sh
docker compose -f deploy/docker-compose.ci.yml restart backend
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao reiniciar backend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend reiniciado" -ForegroundColor Green
Write-Host ""

# 3. Executar diagnóstico pós-deploy
Write-Host "3. Executando diagnóstico para verificar correção..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerHost}" @"
cd ${ProjectPath}
./diagnose-login-error.sh
"@

Write-Host ""
Write-Host "=== FIM DO DEPLOY ===" -ForegroundColor Cyan
Write-Host "Teste o login em: https://ci.z7botsolutions.com.br/login" -ForegroundColor Green
