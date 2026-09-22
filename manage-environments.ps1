# ========================================
# GERENCIADOR DE AMBIENTES FLUXBUS
# Script unificado para gerenciar todos os ambientes
# ========================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "deploy", "setup", "clean")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "dev", "prod", "ci", "all")]
    [string]$Environment = "local",
    
    [Parameter(Mandatory=$false)]
    [string]$Service = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Follow,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Cores para output
$Colors = @{
    Green = "Green"
    Red = "Red"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
    Magenta = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Header {
    Write-ColorOutput "🚀 FluxBus - Gerenciador de Ambientes" "Green"
    Write-ColorOutput "===========================================" "Green"
    Write-ColorOutput "" "White"
}

function Show-Help {
    Write-ColorOutput "📚 Uso do Gerenciador de Ambientes:" "Blue"
    Write-ColorOutput "" "White"
    Write-ColorOutput "COMANDOS:" "Yellow"
    Write-ColorOutput "  start   - Iniciar ambiente" "White"
    Write-ColorOutput "  stop    - Parar ambiente" "White"
    Write-ColorOutput "  restart - Reiniciar ambiente" "White"
    Write-ColorOutput "  status  - Ver status dos serviços" "White"
    Write-ColorOutput "  logs    - Ver logs dos serviços" "White"
    Write-ColorOutput "  deploy  - Fazer deploy para VPS" "White"
    Write-ColorOutput "  setup   - Configurar ambiente" "White"
    Write-ColorOutput "  clean   - Limpar volumes e containers" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "AMBIENTES:" "Yellow"
    Write-ColorOutput "  local   - Desenvolvimento local" "White"
    Write-ColorOutput "  dev     - Ambiente de desenvolvimento" "White"
    Write-ColorOutput "  prod    - Produção" "White"
    Write-ColorOutput "  ci      - Integração contínua" "White"
    Write-ColorOutput "  all     - Todos os ambientes" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "EXEMPLOS:" "Yellow"
    Write-ColorOutput "  .\manage-environments.ps1 -Action start -Environment local" "White"
    Write-ColorOutput "  .\manage-environments.ps1 -Action logs -Environment prod -Service backend -Follow" "White"
    Write-ColorOutput "  .\manage-environments.ps1 -Action deploy -Environment prod" "White"
    Write-ColorOutput "  .\manage-environments.ps1 -Action status -Environment all" "White"
    Write-ColorOutput "" "White"
}

function Get-DockerComposeFile {
    param([string]$Env)
    
    switch ($Env) {
        "local" { return "deploy/docker-compose.local.yml" }
        "dev" { return "deploy/docker-compose.dev.yml" }
        "prod" { return "deploy/docker-compose.prod.yml" }
        "ci" { return "deploy/docker-compose.ci.yml" }
        default { return "docker-compose.yml" }
    }
}

function Get-EnvFile {
    param([string]$Env)
    
    switch ($Env) {
        "local" { return ".env.local" }
        "dev" { return "deploy/env.dev" }
        "prod" { return "deploy/env.prod" }
        "ci" { return "deploy/env.ci" }
        default { return ".env" }
    }
}

function Start-Environment {
    param([string]$Env)
    
    Write-ColorOutput "🚀 Iniciando ambiente: $Env" "Blue"
    
    $composeFile = Get-DockerComposeFile $Env
    $envFile = Get-EnvFile $Env
    
    if (-not (Test-Path $composeFile)) {
        Write-ColorOutput "❌ Arquivo Docker Compose não encontrado: $composeFile" "Red"
        return $false
    }
    
    try {
        if (Test-Path $envFile) {
            Write-ColorOutput "📝 Usando arquivo de ambiente: $envFile" "Blue"
            docker-compose -f $composeFile --env-file $envFile up -d --build
        } else {
            Write-ColorOutput "⚠️ Arquivo de ambiente não encontrado: $envFile" "Yellow"
            docker-compose -f $composeFile up -d --build
        }
        
        Write-ColorOutput "✅ Ambiente $Env iniciado com sucesso!" "Green"
        return $true
    } catch {
        Write-ColorOutput "❌ Erro ao iniciar ambiente $Env : $_" "Red"
        return $false
    }
}

function Stop-Environment {
    param([string]$Env)
    
    Write-ColorOutput "🛑 Parando ambiente: $Env" "Blue"
    
    $composeFile = Get-DockerComposeFile $Env
    
    try {
        docker-compose -f $composeFile down
        Write-ColorOutput "✅ Ambiente $Env parado com sucesso!" "Green"
        return $true
    } catch {
        Write-ColorOutput "❌ Erro ao parar ambiente $Env : $_" "Red"
        return $false
    }
}

function Restart-Environment {
    param([string]$Env)
    
    Write-ColorOutput "🔄 Reiniciando ambiente: $Env" "Blue"
    
    Stop-Environment $Env
    Start-Sleep -Seconds 2
    Start-Environment $Env
}

function Show-EnvironmentStatus {
    param([string]$Env)
    
    Write-ColorOutput "📊 Status do ambiente: $Env" "Blue"
    
    $composeFile = Get-DockerComposeFile $Env
    
    try {
        if (Test-Path $composeFile) {
            docker-compose -f $composeFile ps
        } else {
            Write-ColorOutput "⚠️ Arquivo Docker Compose não encontrado: $composeFile" "Yellow"
        }
    } catch {
        Write-ColorOutput "❌ Erro ao verificar status: $_" "Red"
    }
}

function Show-EnvironmentLogs {
    param([string]$Env, [string]$ServiceName = "", [bool]$FollowLogs = $false)
    
    $composeFile = Get-DockerComposeFile $Env
    
    Write-ColorOutput "📋 Logs do ambiente: $Env" "Blue"
    if ($ServiceName) {
        Write-ColorOutput "🔍 Serviço: $ServiceName" "Blue"
    }
    
    try {
        $logCommand = "docker-compose -f $composeFile logs"
        
        if ($ServiceName) {
            $logCommand += " $ServiceName"
        }
        
        if ($FollowLogs) {
            $logCommand += " -f"
        }
        
        Invoke-Expression $logCommand
    } catch {
        Write-ColorOutput "❌ Erro ao exibir logs: $_" "Red"
    }
}

function Deploy-ToVPS {
    param([string]$Env)
    
    if ($Env -ne "prod") {
        Write-ColorOutput "⚠️ Deploy para VPS é recomendado apenas para produção" "Yellow"
    }
    
    Write-ColorOutput "☁️ Iniciando deploy para VPS..." "Blue"
    
    try {
        # Verificar se script WSL está disponível
        if (Test-Path "deploy/deploy-to-vps-wsl.sh") {
            Write-ColorOutput "🐧 Usando script WSL otimizado..." "Blue"
            
            # Executar via WSL
            $wslScript = @"
cd /mnt/c/dev/fluxbus
chmod +x deploy/deploy-to-vps-wsl.sh
./deploy/deploy-to-vps-wsl.sh
"@
            wsl -e bash -c $wslScript
        } else {
            Write-ColorOutput "⚠️ Script WSL não encontrado, usando PowerShell..." "Yellow"
            .\deploy\deploy-to-vps.ps1
        }
        
        Write-ColorOutput "✅ Deploy para VPS concluído!" "Green"
        return $true
    } catch {
        Write-ColorOutput "❌ Erro no deploy para VPS: $_" "Red"
        return $false
    }
}

function Setup-Environment {
    param([string]$Env)
    
    Write-ColorOutput "🔧 Configurando ambiente: $Env" "Blue"
    
    switch ($Env) {
        "local" {
            .\setup-environments.ps1 -Environment local
        }
        "dev" {
            .\setup-environments.ps1 -Environment dev -WSL
        }
        "prod" {
            .\setup-environments.ps1 -Environment prod -VPS
        }
        "all" {
            .\setup-environments.ps1 -Environment all -WSL -VPS
        }
        default {
            Write-ColorOutput "❌ Ambiente não suportado: $Env" "Red"
        }
    }
}

function Clean-Environment {
    param([string]$Env)
    
    if (-not $Force) {
        $confirm = Read-Host "⚠️ Isso irá remover TODOS os volumes e dados do ambiente $Env. Continuar? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-ColorOutput "❌ Operação cancelada" "Yellow"
            return
        }
    }
    
    Write-ColorOutput "🧹 Limpando ambiente: $Env" "Blue"
    
    $composeFile = Get-DockerComposeFile $Env
    
    try {
        # Parar e remover volumes
        docker-compose -f $composeFile down -v
        
        # Limpar sistema Docker
        docker system prune -f
        
        # Remover imagens não utilizadas
        docker image prune -f
        
        Write-ColorOutput "✅ Ambiente $Env limpo com sucesso!" "Green"
    } catch {
        Write-ColorOutput "❌ Erro ao limpar ambiente $Env : $_" "Red"
    }
}

function Show-AllEnvironmentsStatus {
    Write-ColorOutput "📊 Status de todos os ambientes:" "Blue"
    Write-ColorOutput "" "White"
    
    $environments = @("local", "dev", "prod", "ci")
    
    foreach ($env in $environments) {
        Write-ColorOutput "🔍 Ambiente: $env" "Yellow"
        Show-EnvironmentStatus $env
        Write-ColorOutput "" "White"
    }
}

# ========================================
# EXECUÇÃO PRINCIPAL
# ========================================

Show-Header

# Verificar se estamos no diretório correto
if (-not (Test-Path "docker-compose.yml") -and -not (Test-Path "deploy")) {
    Write-ColorOutput "❌ Execute este script na raiz do projeto FluxBus" "Red"
    exit 1
}

# Verificar se Docker está disponível
try {
    docker --version | Out-Null
} catch {
    Write-ColorOutput "❌ Docker não encontrado. Instale o Docker Desktop" "Red"
    exit 1
}

# Executar ação baseada nos parâmetros
switch ($Action) {
    "start" {
        if ($Environment -eq "all") {
            $environments = @("local", "dev", "prod", "ci")
            foreach ($env in $environments) {
                Start-Environment $env
            }
        } else {
            Start-Environment $Environment
        }
    }
    "stop" {
        if ($Environment -eq "all") {
            $environments = @("local", "dev", "prod", "ci")
            foreach ($env in $environments) {
                Stop-Environment $env
            }
        } else {
            Stop-Environment $Environment
        }
    }
    "restart" {
        if ($Environment -eq "all") {
            $environments = @("local", "dev", "prod", "ci")
            foreach ($env in $environments) {
                Restart-Environment $env
            }
        } else {
            Restart-Environment $Environment
        }
    }
    "status" {
        if ($Environment -eq "all") {
            Show-AllEnvironmentsStatus
        } else {
            Show-EnvironmentStatus $Environment
        }
    }
    "logs" {
        Show-EnvironmentLogs -Env $Environment -ServiceName $Service -FollowLogs $Follow
    }
    "deploy" {
        Deploy-ToVPS -Env $Environment
    }
    "setup" {
        Setup-Environment -Env $Environment
    }
    "clean" {
        if ($Environment -eq "all") {
            $environments = @("local", "dev", "prod", "ci")
            foreach ($env in $environments) {
                Clean-Environment $env
            }
        } else {
            Clean-Environment $Environment
        }
    }
    default {
        Show-Help
    }
}

Write-ColorOutput "" "White"
Write-ColorOutput "🎉 Operação concluída!" "Green"
