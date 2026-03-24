# ===================== SCRIPT PARA GERAR SENHAS SEGURAS (PowerShell) =====================
# Este script gera senhas seguras para todos os ambientes

Write-Host "🔐 Gerando senhas seguras para o projeto SecuredGuard..." -ForegroundColor Green
Write-Host ""

# Função para gerar senha segura
function Generate-Password {
    param([int]$Length = 32)
    
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    $password = ""
    
    for ($i = 0; $i -lt $Length; $i++) {
        $randomIndex = Get-Random -Maximum $chars.Length
        $password += $chars[$randomIndex]
    }
    
    return $password
}

# Função para gerar JWT secret
function Generate-JWTSecret {
    $bytes = New-Object byte[] 64
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return [System.Convert]::ToHexString($bytes).ToLower()
}

Write-Host "=== SENHAS GERADAS ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "# Banco de Dados" -ForegroundColor Cyan
Write-Host "POSTGRES_PASSWORD=$(Generate-Password -Length 32)" -ForegroundColor White
Write-Host ""

Write-Host "# Redis Cache" -ForegroundColor Cyan
Write-Host "REDIS_PASSWORD=$(Generate-Password -Length 24)" -ForegroundColor White
Write-Host ""

Write-Host "# JWT Secret" -ForegroundColor Cyan
Write-Host "JWT_SECRET=$(Generate-JWTSecret)" -ForegroundColor White
Write-Host ""

Write-Host "=== INSTRUÇÕES ===" -ForegroundColor Yellow
Write-Host "1. Copie as senhas acima" -ForegroundColor White
Write-Host "2. Cole nos arquivos .env correspondentes" -ForegroundColor White
Write-Host "3. NUNCA commite senhas no Git" -ForegroundColor Red
Write-Host "4. Mantenha as senhas em local seguro" -ForegroundColor White
Write-Host ""

Write-Host "✅ Senhas geradas com sucesso!" -ForegroundColor Green
