# ========================================
# SCRIPT POWERSHELL PARA DEPLOY NA VPS
# Execute este script APÓS rodar install-vps.sh na VPS
# ========================================

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsHost,
    
    [Parameter(Mandatory=$true)]
    [string]$VpsUser,
    
    [Parameter(Mandatory=$false)]
    [int]$VpsPort = 22
)

# Cores para output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
    exit 1
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

# Verificar se estamos no diretório correto
if (-not (Test-Path "deploy/install-vps.sh")) {
    Write-Error "Execute este script a partir do diretório raiz do projeto SecuredGuard"
}

Write-Log "Iniciando deploy para VPS: $VpsUser@$VpsHost`:$VpsPort"

# ========================================
# 1. TESTAR CONEXÃO SSH
# ========================================
Write-Log "Testando conexão SSH..."
try {
    $sshTest = ssh -p $VpsPort -o ConnectTimeout=10 -o BatchMode=yes $VpsUser@$VpsHost "exit" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Conexão SSH falhou"
    }
} catch {
    Write-Error "Não foi possível conectar à VPS. Verifique:`n- IP da VPS: $VpsHost`n- Usuário: $VpsUser`n- Porta: $VpsPort`n- Chave SSH configurada"
}

Write-Log "Conexão SSH OK!"

# ========================================
# 2. EXECUTAR INSTALAÇÃO NA VPS
# ========================================
Write-Log "Executando instalação na VPS..."

# Copiar script de instalação
Write-Log "Copiando script de instalação..."
scp -P $VpsPort deploy/install-vps.sh ${VpsUser}@${VpsHost}:/tmp/

# Executar instalação
Write-Log "Executando instalação..."
ssh -p $VpsPort $VpsUser@$VpsHost "chmod +x /tmp/install-vps.sh && /tmp/install-vps.sh"

Write-Log "Instalação na VPS concluída!"

# ========================================
# 3. COPIAR CÓDIGO DO PROJETO
# ========================================
Write-Log "Copiando código do projeto para VPS..."

# Criar arquivo temporário com exclusões
$excludeFile = ".rsync-exclude.temp"
@"
node_modules/
target/
.git/
*.log
*.tmp
.env
uploads/
logs/
backups/
"@ | Out-File -FilePath $excludeFile -Encoding UTF8

try {
    # Usar rsync para copiar apenas arquivos necessários
    Write-Log "Sincronizando arquivos..."
    rsync -avz --delete --exclude-from=$excludeFile -e "ssh -p $VpsPort" ./ ${VpsUser}@${VpsHost}:/opt/secured-guard/
} finally {
    # Limpar arquivo temporário
    Remove-Item $excludeFile -ErrorAction SilentlyContinue
}

Write-Log "Código copiado para VPS!"

# ========================================
# 4. EXECUTAR DEPLOY
# ========================================
Write-Log "Executando deploy na VPS..."

ssh -p $VpsPort $VpsUser@$VpsHost "cd /opt/secured-guard && ./deploy.sh"

Write-Log "Deploy concluído!"

# ========================================
# 5. VERIFICAR STATUS
# ========================================
Write-Log "Verificando status dos serviços..."

ssh -p $VpsPort $VpsUser@$VpsHost "cd /opt/secured-guard && docker compose -f deploy/docker-compose.prod.yml ps"

# ========================================
# FINALIZAÇÃO
# ========================================
Write-Log "Deploy concluído com sucesso!"
Write-Host ""
Write-Info "Acesse sua aplicação em:"
Write-Host "🌐 https://$VpsHost" -ForegroundColor $Green
Write-Host ""
Write-Info "Comandos úteis na VPS:"
Write-Host "- Ver logs: docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f"
Write-Host "- Status: docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml ps"
Write-Host "- Backup: /opt/secured-guard/backup.sh"
Write-Host "- Restart: cd /opt/secured-guard && ./deploy.sh"
Write-Host ""
Write-Warning "IMPORTANTE: Configure seu domínio e certificados SSL reais para produção!"
