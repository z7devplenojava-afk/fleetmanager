# ========================================
# PIPELINE DE INICIALIZAÇÃO SEQUENCIAL
# CI → DEV → PROD
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("ci", "dev", "prod", "all")]
    [string]$StartFrom = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$DeployToVPS,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowDetails
)

# Cores para output
$Colors = @{
    Green = "Green"
    Red = "Red"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
    Magenta = "Magenta"
    Cyan = "Cyan"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Header {
    param([string]$Title, [string]$Color = "Blue")
    Write-ColorOutput "" "White"
    Write-ColorOutput "=========================================" $Color
    Write-ColorOutput "  $Title" $Color
    Write-ColorOutput "=========================================" $Color
    Write-ColorOutput "" "White"
}

function Write-Step {
    param([string]$Step, [string]$Description)
    Write-ColorOutput "🔄 $Step" "Blue"
    Write-ColorOutput "   $Description" "White"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️ $Message" "Yellow"
}

function Test-Environment {
    param([string]$Env)
    
    Write-Step "Verificando ambiente $Env" "Testando conectividade e saúde dos serviços"
    
    $composeFile = switch ($Env) {
        "ci" { "deploy/docker-compose.ci.yml" }
        "dev" { "deploy/docker-compose.dev.yml" }
        "prod" { "deploy/docker-compose.prod.yml" }
        default { "docker-compose.yml" }
    }
    
    if (-not (Test-Path $composeFile)) {
        Write-Error "Arquivo Docker Compose não encontrado: $composeFile"
        return $false
    }
    
    try {
        $status = docker-compose -f $composeFile ps --services --filter "status=running" 2>$null
        if ($status) {
            Write-Success "Ambiente $Env está funcionando"
            return $true
        } else {
            Write-Warning "Ambiente $Env não está rodando"
            return $false
        }
    } catch {
        Write-Error "Erro ao verificar ambiente $Env : $_"
        return $false
    }
}

function Start-CIEnvironment {
    Write-Header "🧪 INICIANDO AMBIENTE CI" "Magenta"
    
    Write-Step "Configurando CI" "Preparando ambiente de testes automatizados"
    
    # Verificar se arquivo CI existe
    if (-not (Test-Path "deploy/docker-compose.ci.yml")) {
        Write-Error "Arquivo docker-compose.ci.yml não encontrado"
        return $false
    }
    
    try {
        # Parar ambiente CI se estiver rodando
        docker-compose -f deploy/docker-compose.ci.yml down 2>$null
        
        # Iniciar ambiente CI
        Write-Step "Subindo containers CI" "PostgreSQL, Redis, Backend, Frontend"
        docker-compose -f deploy/docker-compose.ci.yml up -d --build
        
        # Aguardar serviços ficarem prontos
        Write-Step "Aguardando serviços CI" "Verificando saúde dos containers"
        Start-Sleep -Seconds 15
        
        # Verificar saúde dos serviços
        $ciHealthy = Test-Environment "ci"
        
        if ($ciHealthy) {
            Write-Success "Ambiente CI iniciado com sucesso!"
            Write-ColorOutput "   Frontend: http://localhost:5174" "White"
            Write-ColorOutput "   Backend:  http://localhost:8081" "White"
            Write-ColorOutput "   Database: localhost:55432" "White"
            Write-ColorOutput "   Redis:    localhost:6380" "White"
            return $true
        } else {
            Write-Error "Falha ao iniciar ambiente CI"
            return $false
        }
    } catch {
        Write-Error "Erro ao iniciar ambiente CI: $_"
        return $false
    }
}

function Start-DevEnvironment {
    Write-Header "🛠️ INICIANDO AMBIENTE DEV" "Cyan"
    
    Write-Step "Configurando DEV" "Preparando ambiente de desenvolvimento"
    
    # Verificar se arquivo DEV existe
    if (-not (Test-Path "deploy/docker-compose.dev.yml")) {
        Write-Error "Arquivo docker-compose.dev.yml não encontrado"
        return $false
    }
    
    try {
        # Parar ambiente DEV se estiver rodando
        docker-compose -f deploy/docker-compose.dev.yml down 2>$null
        
        # Iniciar ambiente DEV
        Write-Step "Subindo containers DEV" "PostgreSQL, Redis, Backend, Frontend"
        docker-compose -f deploy/docker-compose.dev.yml up -d --build
        
        # Aguardar serviços ficarem prontos
        Write-Step "Aguardando serviços DEV" "Verificando saúde dos containers"
        Start-Sleep -Seconds 15
        
        # Verificar saúde dos serviços
        $devHealthy = Test-Environment "dev"
        
        if ($devHealthy) {
            Write-Success "Ambiente DEV iniciado com sucesso!"
            Write-ColorOutput "   Frontend: http://localhost:3000" "White"
            Write-ColorOutput "   Backend:  http://localhost:8081" "White"
            Write-ColorOutput "   Database: localhost:5432" "White"
            Write-ColorOutput "   Redis:    localhost:6379" "White"
            return $true
        } else {
            Write-Error "Falha ao iniciar ambiente DEV"
            return $false
        }
    } catch {
        Write-Error "Erro ao iniciar ambiente DEV: $_"
        return $false
    }
}

function Start-ProdEnvironment {
    Write-Header "🚀 INICIANDO AMBIENTE PROD" "Green"
    
    if ($DeployToVPS) {
        Write-Step "Deploy para VPS" "Iniciando deploy para servidor de produção"
        
        try {
            # Usar script de deploy existente
            if (Test-Path "deploy/deploy-to-vps-wsl.sh") {
                Write-Step "Executando deploy via WSL" "Usando script otimizado"
                
                $wslScript = @"
cd /mnt/c/dev/fluxbus
chmod +x deploy/deploy-to-vps-wsl.sh
./deploy/deploy-to-vps-wsl.sh
"@
                wsl -e bash -c $wslScript
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Deploy para VPS concluído!"
                    return $true
                } else {
                    Write-Error "Falha no deploy para VPS"
                    return $false
                }
            } else {
                Write-Error "Script de deploy WSL não encontrado"
                return $false
            }
        } catch {
            Write-Error "Erro no deploy para VPS: $_"
            return $false
        }
    } else {
        Write-Step "Configurando PROD local" "Preparando ambiente de produção local"
        
        # Verificar se arquivo PROD existe
        if (-not (Test-Path "deploy/docker-compose.prod.yml")) {
            Write-Error "Arquivo docker-compose.prod.yml não encontrado"
            return $false
        }
        
        try {
            # Parar ambiente PROD se estiver rodando
            docker-compose -f deploy/docker-compose.prod.yml down 2>$null
            
            # Iniciar ambiente PROD
            Write-Step "Subindo containers PROD" "PostgreSQL, Redis, Backend, Frontend, Nginx"
            docker-compose -f deploy/docker-compose.prod.yml up -d --build
            
            # Aguardar serviços ficarem prontos
            Write-Step "Aguardando serviços PROD" "Verificando saúde dos containers"
            Start-Sleep -Seconds 20
            
            # Verificar saúde dos serviços
            $prodHealthy = Test-Environment "prod"
            
            if ($prodHealthy) {
                Write-Success "Ambiente PROD iniciado com sucesso!"
                Write-ColorOutput "   Frontend: http://localhost:80" "White"
                Write-ColorOutput "   Backend:  http://localhost:8080" "White"
                Write-ColorOutput "   HTTPS:    https://localhost:443" "White"
                return $true
            } else {
                Write-Error "Falha ao iniciar ambiente PROD"
                return $false
            }
        } catch {
            Write-Error "Erro ao iniciar ambiente PROD: $_"
            return $false
        }
    }
}

function Show-PipelineStatus {
    Write-Header "📊 STATUS DO PIPELINE" "Blue"
    
    $environments = @("ci", "dev", "prod")
    $results = @{}
    
    foreach ($env in $environments) {
        Write-ColorOutput "🔍 Verificando ambiente: $env" "Blue"
        $results[$env] = Test-Environment $env
    }
    
    Write-ColorOutput "" "White"
    Write-ColorOutput "📈 Resumo do Pipeline:" "Blue"
    
    foreach ($env in $environments) {
        $status = if ($results[$env]) { "✅ FUNCIONANDO" } else { "❌ PARADO" }
        $color = if ($results[$env]) { "Green" } else { "Red" }
        Write-ColorOutput "   $env : $status" $color
    }
    
    # Mostrar URLs de acesso
    Write-ColorOutput "" "White"
    Write-ColorOutput "🌐 URLs de Acesso:" "Blue"
    
    if ($results["ci"]) {
        Write-ColorOutput "   CI Frontend:  http://localhost:5174" "White"
        Write-ColorOutput "   CI Backend:   http://localhost:8081" "White"
    }
    
    if ($results["dev"]) {
        Write-ColorOutput "   DEV Frontend: http://localhost:3000" "White"
        Write-ColorOutput "   DEV Backend:  http://localhost:8081" "White"
    }
    
    if ($results["prod"]) {
        Write-ColorOutput "   PROD Frontend: http://localhost:80" "White"
        Write-ColorOutput "   PROD Backend:  http://localhost:8080" "White"
        Write-ColorOutput "   PROD HTTPS:    https://localhost:443" "White"
    }
}

function Show-PipelineHelp {
    Write-Header "📚 PIPELINE DE INICIALIZAÇÃO SEQUENCIAL" "Blue"
    Write-ColorOutput "" "White"
    Write-ColorOutput "Este script inicia os ambientes na sequência: CI → DEV → PROD" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "PARÂMETROS:" "Yellow"
    Write-ColorOutput "  -StartFrom    Ambiente para iniciar (ci, dev, prod, all)" "White"
    Write-ColorOutput "  -SkipTests    Pular testes automatizados" "White"
    Write-ColorOutput "  -DeployToVPS  Fazer deploy para VPS em vez de local" "White"
    Write-ColorOutput "  -ShowDetails  Mostrar logs detalhados" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "EXEMPLOS:" "Yellow"
    Write-ColorOutput "  .\startup-pipeline.ps1 -StartFrom all" "White"
    Write-ColorOutput "  .\startup-pipeline.ps1 -StartFrom dev -DeployToVPS" "White"
    Write-ColorOutput "  .\startup-pipeline.ps1 -StartFrom ci -SkipTests" "White"
    Write-ColorOutput "" "White"
    Write-ColorOutput "SEQUÊNCIA:" "Yellow"
    Write-ColorOutput "  1. CI   - Testes automatizados (portas 5174, 8081, 55432, 6380)" "White"
    Write-ColorOutput "  2. DEV  - Desenvolvimento (portas 3000, 8081, 5432, 6379)" "White"
    Write-ColorOutput "  3. PROD - Produção local ou VPS (portas 80/443, 8080, 5432, 6379)" "White"
}

# ========================================
# EXECUÇÃO PRINCIPAL
# ========================================

Write-Header "🚀 FLUXBUS - PIPELINE DE INICIALIZAÇÃO" "Green"

# Verificar se estamos no diretório correto
if (-not (Test-Path "docker-compose.yml") -and -not (Test-Path "deploy")) {
    Write-Error "Execute este script na raiz do projeto FluxBus"
    exit 1
}

# Verificar Docker
try {
    docker --version | Out-Null
} catch {
    Write-Error "Docker não encontrado. Instale o Docker Desktop"
    exit 1
}

# Verificar se Docker está rodando
try {
    docker info | Out-Null
} catch {
    Write-Error "Docker não está rodando. Inicie o Docker Desktop"
    exit 1
}

Write-Success "Docker está funcionando!"

# Executar pipeline baseado nos parâmetros
$results = @{}

switch ($StartFrom) {
    "ci" {
        $results["ci"] = Start-CIEnvironment
    }
    "dev" {
        $results["dev"] = Start-DevEnvironment
    }
    "prod" {
        $results["prod"] = Start-ProdEnvironment
    }
    "all" {
        Write-ColorOutput "" "White"
        Write-ColorOutput "🎯 Iniciando pipeline completo: CI → DEV → PROD" "Blue"
        
        # 1. CI
        $results["ci"] = Start-CIEnvironment
        if ($results["ci"]) {
            Write-ColorOutput "⏳ Aguardando estabilização do CI..." "Yellow"
            Start-Sleep -Seconds 5
        }
        
        # 2. DEV
        $results["dev"] = Start-DevEnvironment
        if ($results["dev"]) {
            Write-ColorOutput "⏳ Aguardando estabilização do DEV..." "Yellow"
            Start-Sleep -Seconds 5
        }
        
        # 3. PROD
        $results["prod"] = Start-ProdEnvironment
    }
    default {
        Show-PipelineHelp
        exit 0
    }
}

# Mostrar status final
Show-PipelineStatus

# Resumo final
Write-ColorOutput "" "White"
Write-Header "🎉 PIPELINE CONCLUÍDO" "Green"

$successCount = ($results.Values | Where-Object { $_ -eq $true }).Count
$totalCount = $results.Count

Write-ColorOutput "✅ Ambientes iniciados com sucesso: $successCount/$totalCount" "Green"

if ($successCount -eq $totalCount) {
    Write-Success "Todos os ambientes estão funcionando perfeitamente!"
} else {
    Write-Warning "Alguns ambientes podem precisar de atenção"
}

Write-ColorOutput "" "White"
Write-ColorOutput "📚 Comandos úteis:" "Blue"
Write-ColorOutput "  Ver logs:     .\manage-environments.ps1 -Action logs -Environment [ci|dev|prod] -Follow" "White"
Write-ColorOutput "  Parar todos:  .\manage-environments.ps1 -Action stop -Environment all" "White"
Write-ColorOutput "  Status:       .\manage-environments.ps1 -Action status -Environment all" "White"
