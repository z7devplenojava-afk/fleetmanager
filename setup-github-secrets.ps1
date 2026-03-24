# ========================================
# Script para Gerar e Configurar Secrets do GitHub Actions
# ========================================

Write-Host "🔐 Gerador de Secrets para GitHub Actions" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Função para gerar senha segura
function New-SecurePassword {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Criar objeto para armazenar secrets
$secrets = @{}

Write-Host "📝 Gerando secrets seguros...`n" -ForegroundColor Yellow

# ========================================
# 1. CONFIGURAÇÕES DA VPS
# ========================================
Write-Host "1️⃣ CONFIGURAÇÕES DA VPS" -ForegroundColor Green
Write-Host "─────────────────────────`n" -ForegroundColor Gray

$vpsHost = Read-Host "Digite o IP ou domínio da VPS (ex: 192.168.1.100)"
$secrets["VPS_HOST"] = $vpsHost

$vpsUser = Read-Host "Digite o usuário SSH da VPS (ex: root, ubuntu)"
$secrets["VPS_USER"] = $vpsUser

Write-Host "`n⚠️  Para VPS_SSH_KEY:" -ForegroundColor Yellow
Write-Host "   1. Abra Git Bash ou WSL" -ForegroundColor Gray
Write-Host "   2. Execute: cat ~/.ssh/id_rsa" -ForegroundColor Gray
Write-Host "   3. Copie TODO o conteúdo (incluindo -----BEGIN e -----END)" -ForegroundColor Gray
Write-Host "`nPressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

$vpsPort = Read-Host "`nPorta SSH da VPS (padrão: 22)"
if ([string]::IsNullOrWhiteSpace($vpsPort)) { $vpsPort = "22" }
$secrets["VPS_PORT"] = $vpsPort

$vpsUrl = Read-Host "URL pública do sistema (ex: https://secured-guard.com) [opcional]"
if (![string]::IsNullOrWhiteSpace($vpsUrl)) {
    $secrets["VPS_URL"] = $vpsUrl
}

# ========================================
# 2. CONFIGURAÇÕES DO BANCO DE DADOS
# ========================================
Write-Host "`n2️⃣ CONFIGURAÇÕES DO BANCO DE DADOS" -ForegroundColor Green
Write-Host "─────────────────────────────────────`n" -ForegroundColor Gray

$secrets["POSTGRES_DB"] = "secured_guard_prod"
$secrets["POSTGRES_USER"] = "postgressg"
$secrets["POSTGRES_PASSWORD"] = New-SecurePassword

Write-Host "✅ POSTGRES_DB: secured_guard_prod" -ForegroundColor Gray
Write-Host "✅ POSTGRES_USER: postgressg" -ForegroundColor Gray
Write-Host "✅ POSTGRES_PASSWORD: [gerada automaticamente]" -ForegroundColor Gray

# ========================================
# 3. CONFIGURAÇÕES DO REDIS
# ========================================
Write-Host "`n3️⃣ CONFIGURAÇÕES DO REDIS" -ForegroundColor Green
Write-Host "───────────────────────────`n" -ForegroundColor Gray

$secrets["REDIS_PASSWORD"] = New-SecurePassword
Write-Host "✅ REDIS_PASSWORD: [gerada automaticamente]" -ForegroundColor Gray

# ========================================
# 4. CONFIGURAÇÕES DA APLICAÇÃO
# ========================================
Write-Host "`n4️⃣ CONFIGURAÇÕES DA APLICAÇÃO" -ForegroundColor Green
Write-Host "──────────────────────────────────`n" -ForegroundColor Gray

$secrets["JWT_SECRET"] = New-SecurePassword -Length 64
Write-Host "✅ JWT_SECRET: [gerada automaticamente - 64 bytes]" -ForegroundColor Gray

$apiUrl = Read-Host "`nURL da API (ex: https://api.secured-guard.com/api ou http://${vpsHost}:8080/api)"
$secrets["VITE_API_URL"] = $apiUrl

$wsUrl = Read-Host "URL do WebSocket (ex: wss://api.secured-guard.com/ws ou ws://${vpsHost}:8080/ws)"
$secrets["VITE_WS_URL"] = $wsUrl

# ========================================
# 5. SALVAR EM ARQUIVO
# ========================================
Write-Host "`n📁 SALVANDO SECRETS..." -ForegroundColor Cyan

$secretsFile = "github-secrets.txt"
$secretsJson = "github-secrets.json"

# Arquivo de texto
$output = @"
# ========================================
# GitHub Secrets para Secured Guard
# Gerado em: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
# ========================================

IMPORTANTE: Configure estes secrets em:
https://github.com/zemarioramos/secured-guard/settings/secrets/actions

========================================
SECRETS NECESSÁRIOS:
========================================

"@

foreach ($key in $secrets.Keys | Sort-Object) {
    $output += "`n$key`n"
    $output += "$($secrets[$key])`n"
    $output += "----------------------------------------`n"
}

$output | Out-File -FilePath $secretsFile -Encoding UTF8

# Arquivo JSON
$secrets | ConvertTo-Json | Out-File -FilePath $secretsJson -Encoding UTF8

Write-Host "✅ Secrets salvos em:" -ForegroundColor Green
Write-Host "   📄 $secretsFile (formato texto)" -ForegroundColor Gray
Write-Host "   📄 $secretsJson (formato JSON)" -ForegroundColor Gray

# ========================================
# 6. GERAR COMANDOS GH CLI
# ========================================
Write-Host "`n📝 GERANDO COMANDOS GH CLI..." -ForegroundColor Cyan

$ghCommands = @"
# ========================================
# Comandos para configurar secrets usando GitHub CLI (gh)
# ========================================

# Instalar GitHub CLI: https://cli.github.com/

# Fazer login
gh auth login

# Configurar secrets (execute um por um):

"@

foreach ($key in $secrets.Keys | Sort-Object) {
    $value = $secrets[$key]
    # Escapar aspas duplas
    $value = $value -replace '"', '\"'
    $ghCommands += "gh secret set $key --body `"$value`" --repo zemarioramos/secured-guard`n"
}

$ghCommandsFile = "github-secrets-gh-cli.sh"
$ghCommands | Out-File -FilePath $ghCommandsFile -Encoding UTF8

Write-Host "✅ Comandos GH CLI salvos em: $ghCommandsFile" -ForegroundColor Green

# ========================================
# 7. EXIBIR RESUMO
# ========================================
Write-Host "`n📊 RESUMO DOS SECRETS GERADOS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "VPS:" -ForegroundColor Yellow
Write-Host "  Host: $($secrets['VPS_HOST'])" -ForegroundColor Gray
Write-Host "  User: $($secrets['VPS_USER'])" -ForegroundColor Gray
Write-Host "  Port: $($secrets['VPS_PORT'])" -ForegroundColor Gray
if ($secrets.ContainsKey('VPS_URL')) {
    Write-Host "  URL: $($secrets['VPS_URL'])" -ForegroundColor Gray
}

Write-Host "`nDatabase:" -ForegroundColor Yellow
Write-Host "  DB: $($secrets['POSTGRES_DB'])" -ForegroundColor Gray
Write-Host "  User: $($secrets['POSTGRES_USER'])" -ForegroundColor Gray
Write-Host "  Password: [gerada]" -ForegroundColor Gray

Write-Host "`nRedis:" -ForegroundColor Yellow
Write-Host "  Password: [gerada]" -ForegroundColor Gray

Write-Host "`nAplicação:" -ForegroundColor Yellow
Write-Host "  JWT Secret: [gerada - 64 bytes]" -ForegroundColor Gray
Write-Host "  API URL: $($secrets['VITE_API_URL'])" -ForegroundColor Gray
Write-Host "  WS URL: $($secrets['VITE_WS_URL'])" -ForegroundColor Gray

# ========================================
# 8. PRÓXIMOS PASSOS
# ========================================
Write-Host "`n🎯 PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Configure os secrets no GitHub:" -ForegroundColor White
Write-Host "   https://github.com/zemarioramos/secured-guard/settings/secrets/actions`n" -ForegroundColor Gray

Write-Host "2. Copie os valores do arquivo: $secretsFile`n" -ForegroundColor White

Write-Host "3. Ou use GitHub CLI (mais rápido):" -ForegroundColor White
Write-Host "   bash $ghCommandsFile`n" -ForegroundColor Gray

Write-Host "4. Para VPS_SSH_KEY:" -ForegroundColor White
Write-Host "   - Abra Git Bash: cat ~/.ssh/id_rsa" -ForegroundColor Gray
Write-Host "   - Copie TODA a chave privada" -ForegroundColor Gray
Write-Host "   - Cole no secret VPS_SSH_KEY`n" -ForegroundColor Gray

Write-Host "5. Teste o deploy:" -ForegroundColor White
Write-Host "   git commit --allow-empty -m 'test: trigger deploy'" -ForegroundColor Gray
Write-Host "   git push origin main`n" -ForegroundColor Gray

Write-Host "✅ Script concluído! Arquivos criados:" -ForegroundColor Green
Write-Host "   📄 $secretsFile" -ForegroundColor Gray
Write-Host "   📄 $secretsJson" -ForegroundColor Gray
Write-Host "   📄 $ghCommandsFile`n" -ForegroundColor Gray

Write-Host "⚠️  IMPORTANTE: Mantenha estes arquivos em local seguro e NÃO commite no Git!" -ForegroundColor Red

