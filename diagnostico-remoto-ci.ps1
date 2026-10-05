# PowerShell Script para Diagnóstico Remoto
# Execute este script no seu computador Windows para fazer diagnóstico no servidor CI

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerUser,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerHost = "ci.z7botsolutions.com.br",
    
    [string]$ProjectPath = "/var/www/fluxbus"
)

Write-Host "=== DIAGNÓSTICO REMOTO - LOGIN CI ===" -ForegroundColor Cyan
Write-Host ""

# 1. Upload do script de diagnóstico
Write-Host "1. Fazendo upload do script de diagnóstico..." -ForegroundColor Yellow
scp diagnostico-login-ci.sh "${ServerUser}@${ServerHost}:${ProjectPath}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer upload do script" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Script enviado com sucesso" -ForegroundColor Green
Write-Host ""

# 2. Executar diagnóstico remoto
Write-Host "2. Executando diagnóstico no servidor..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerHost}" @"
cd ${ProjectPath}
chmod +x diagnostico-login-ci.sh
./diagnostico-login-ci.sh
"@

Write-Host ""
Write-Host "=== FIM DO DIAGNÓSTICO ===" -ForegroundColor Cyan
Write-Host ""

# 3. Perguntar se deseja aplicar correção
$resposta = Read-Host "Deseja aplicar a correção SQL? (S/N)"

if ($resposta -eq "S" -or $resposta -eq "s") {
    Write-Host ""
    Write-Host "3. Fazendo upload do script SQL..." -ForegroundColor Yellow
    scp fix-users-without-roles-ci.sql "${ServerUser}@${ServerHost}:${ProjectPath}/"
    
    Write-Host "4. Aplicando correção..." -ForegroundColor Yellow
    ssh "${ServerUser}@${ServerHost}" @"
cd ${ProjectPath}
docker exec -i fluxbus-postgres-ci psql -U fluxbus_user -d fluxbus < fix-users-without-roles-ci.sql
"@
    
    Write-Host ""
    Write-Host "✅ Correção aplicada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Agora teste o login em: https://ci.z7botsolutions.com.br" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Diagnóstico concluído!" -ForegroundColor Green
