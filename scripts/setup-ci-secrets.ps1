# =====================================================
# SCRIPT: Gerar Secrets para GitHub Actions - CI
# =====================================================

Write-Host "🔐 CONFIGURAÇÃO DE SECRETS - AMBIENTE CI" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Função para gerar senha forte
function Generate-StrongPassword {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Função para gerar JWT secret
function Generate-JWTSecret {
    $bytes = New-Object byte[] 64
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Coletar informações
Write-Host "📝 Preencha as informações do ambiente CI:" -ForegroundColor Yellow
Write-Host ""

$vpsHost = Read-Host "  IP ou hostname da VPS (ex: 123.456.789.10)"
$vpsUser = Read-Host "  Usuário SSH da VPS (ex: ubuntu, root)"
$dbPassword = Generate-StrongPassword
$jwtSecret = Generate-JWTSecret

Write-Host ""
Write-Host "✨ Senhas geradas automaticamente!" -ForegroundColor Green
Write-Host ""

# Gerar formato para GitHub Secrets
$secrets = @"

==============================================
🔑 SECRETS PARA GITHUB ACTIONS - AMBIENTE CI
==============================================

Vá em: GitHub → Seu Repositório → Settings → Secrets and variables → Actions

Adicione os seguintes secrets:

──────────────────────────────────────────────
VPS_CI_HOST
──────────────────────────────────────────────
$vpsHost

──────────────────────────────────────────────
VPS_CI_USER
──────────────────────────────────────────────
$vpsUser

──────────────────────────────────────────────
VPS_CI_SSH_KEY
──────────────────────────────────────────────
[VOCÊ PRECISA GERAR UMA CHAVE SSH]

Para gerar a chave SSH:
  ssh-keygen -t ed25519 -C "github-actions-ci" -f ~/.ssh/github_ci_key
  ssh-copy-id -i ~/.ssh/github_ci_key.pub $vpsUser@$vpsHost
  
Cole o conteúdo COMPLETO do arquivo ~/.ssh/github_ci_key aqui
(incluindo -----BEGIN OPENSSH PRIVATE KEY----- e -----END OPENSSH PRIVATE KEY-----)

──────────────────────────────────────────────
DB_CI_URL
──────────────────────────────────────────────
jdbc:postgresql://localhost:5432/secured_guard_ci

──────────────────────────────────────────────
DB_CI_USERNAME
──────────────────────────────────────────────
secured_guard_ci

──────────────────────────────────────────────
DB_CI_PASSWORD
──────────────────────────────────────────────
$dbPassword

──────────────────────────────────────────────
JWT_SECRET_CI
──────────────────────────────────────────────
$jwtSecret

==============================================

📋 COMANDOS PARA EXECUTAR NA VPS:
==============================================

# 1. Criar banco de dados
sudo -u postgres psql << 'SQLEOF'
CREATE DATABASE secured_guard_ci;
CREATE USER secured_guard_ci WITH ENCRYPTED PASSWORD '$dbPassword';
GRANT ALL PRIVILEGES ON DATABASE secured_guard_ci TO secured_guard_ci;
\c secured_guard_ci
GRANT ALL ON SCHEMA public TO secured_guard_ci;
SQLEOF

# 2. Criar estrutura de diretórios
sudo mkdir -p /var/www/secured-guard/ci/{backend,frontend,logs,uploads,backups}
sudo chown -R $vpsUser:$vpsUser /var/www/secured-guard/ci

# 3. Configurar firewall (se necessário)
sudo ufw allow 8082/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

==============================================

📝 PRÓXIMOS PASSOS:
==============================================

1. ✅ Adicionar todos os secrets no GitHub
2. ✅ Executar os comandos acima na VPS
3. ✅ Configurar DNS: ci.z7botsolutions.com.br → $vpsHost
4. ✅ Criar branch ci e fazer push
5. ✅ Aguardar o deploy automático
6. ✅ Configurar SSL com certbot

==============================================

"@

# Salvar em arquivo
$outputFile = "CI_SECRETS_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$secrets | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host $secrets
Write-Host ""
Write-Host "✅ Secrets salvos em: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Guarde este arquivo em local seguro!" -ForegroundColor Yellow
Write-Host "    Ele contém informações sensíveis do seu sistema." -ForegroundColor Yellow
Write-Host ""

# Abrir arquivo
Start-Process notepad.exe $outputFile

