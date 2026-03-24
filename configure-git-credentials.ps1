# Script para configurar credenciais do Git
# Executa: .\configure-git-credentials.ps1

$username = "zmarioramos"
$token = "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"

Write-Host "🔧 Configurando credenciais do Git..." -ForegroundColor Cyan

# 1. Configurar credential helper
Write-Host "1. Configurando credential helper..." -ForegroundColor Yellow
git config --global credential.helper store
git config --global credential.https://github.com.helper store

# 2. Criar arquivo .git-credentials
Write-Host "2. Criando arquivo .git-credentials..." -ForegroundColor Yellow
$credentialsPath = "$env:USERPROFILE\.git-credentials"
$credentialLine = "https://${username}:${token}@github.com"
[System.IO.File]::WriteAllText($credentialsPath, $credentialLine)

# 3. Configurar URL rewrite para GitHub
Write-Host "3. Configurando URL rewrite..." -ForegroundColor Yellow
git config --global url."https://${username}:${token}@github.com/".insteadOf "https://github.com/"

# 4. Desabilitar GIT_ASKPASS (se estiver configurado)
Write-Host "4. Desabilitando GIT_ASKPASS..." -ForegroundColor Yellow
$env:GIT_ASKPASS = ""
[Environment]::SetEnvironmentVariable("GIT_ASKPASS", "", "User")

# 5. Desabilitar prompt de credenciais
Write-Host "5. Desabilitando prompt de credenciais..." -ForegroundColor Yellow
git config --global core.askpass ""
git config --global credential.interactive never

# 6. Verificar configurações
Write-Host "`n✅ Configurações aplicadas!" -ForegroundColor Green
Write-Host "`n📋 Verificando configurações:" -ForegroundColor Cyan
git config --global --get credential.helper
git config --global --get url."https://${username}:${token}@github.com/".insteadOf

Write-Host "`n✅ Configuração concluída!" -ForegroundColor Green
Write-Host "Teste com: git fetch" -ForegroundColor Yellow



















