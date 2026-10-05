# ========================================
# SCRIPT DE INICIALIZAÇÃO COMPLETA
# EnvioHolerites - Sistema Completo
# ========================================

param(
    [switch]$SkipDependencies,
    [switch]$SkipTests,
    [switch]$SkipMonitoring,
    [switch]$Production,
    [string]$Environment = "development"
)

Write-Host "🚀 Iniciando Sistema EnvioHolerites Completo..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# ========================================
# CONFIGURAÇÕES
# ========================================
$BackendPort = 8080
$FrontendPort = 5173
$DatabasePort = 5432
$RedisPort = 6379
$WPPConnectPort = 8081
$BaileysPort = 3000
$N8nPort = 5678
$PrometheusPort = 9090
$GrafanaPort = 3001
$ElasticsearchPort = 9200
$KibanaPort = 5601

# ========================================
# FUNÇÕES AUXILIARES
# ========================================
function Write-Step {
    param([string]$Message)
    Write-Host "`n📋 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Wait-ForService {
    param([int]$Port, [string]$ServiceName, [int]$Timeout = 60)
    
    Write-Host "⏳ Aguardando $ServiceName na porta $Port..." -ForegroundColor Yellow
    
    $startTime = Get-Date
    while ((Get-Date) -lt $startTime.AddSeconds($Timeout)) {
        if (Test-Port -Port $Port) {
            Write-Success "$ServiceName está pronto!"
            return $true
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Error "Timeout aguardando $ServiceName"
    return $false
}

# ========================================
# VERIFICAÇÃO DE DEPENDÊNCIAS
# ========================================
if (-not $SkipDependencies) {
    Write-Step "Verificando dependências do sistema..."
    
    # Verificar Java
    try {
        $javaVersion = java -version 2>&1 | Select-String "version"
        if ($javaVersion) {
            Write-Success "Java encontrado: $javaVersion"
        } else {
            Write-Error "Java não encontrado. Instale o Java 17 ou superior."
            exit 1
        }
    }
    catch {
        Write-Error "Java não encontrado. Instale o Java 17 ou superior."
        exit 1
    }
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js encontrado: $nodeVersion"
    }
    catch {
        Write-Error "Node.js não encontrado. Instale o Node.js 18 ou superior."
        exit 1
    }
    
    # Verificar Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker encontrado: $dockerVersion"
    }
    catch {
        Write-Warning "Docker não encontrado. Alguns serviços podem não funcionar."
    }
    
    # Verificar Git
    try {
        $gitVersion = git --version
        Write-Success "Git encontrado: $gitVersion"
    }
    catch {
        Write-Warning "Git não encontrado."
    }
}

# ========================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ========================================
Write-Step "Instalando dependências..."

# Backend dependencies
if (Test-Path "backend") {
    Write-Host "📦 Instalando dependências do Backend..." -ForegroundColor Yellow
    Set-Location backend
    if (Test-Path "mvnw") {
        ./mvnw clean install -DskipTests
    } else {
        mvn clean install -DskipTests
    }
    Set-Location ..
    Write-Success "Dependências do Backend instaladas"
}

# Frontend dependencies
if (Test-Path "frontend") {
    Write-Host "📦 Instalando dependências do Frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Success "Dependências do Frontend instaladas"
}

# ========================================
# EXECUÇÃO DE TESTES
# ========================================
if (-not $SkipTests) {
    Write-Step "Executando testes..."
    
    # Backend tests
    if (Test-Path "backend") {
        Write-Host "🧪 Executando testes do Backend..." -ForegroundColor Yellow
        Set-Location backend
        if (Test-Path "mvnw") {
            ./mvnw test
        } else {
            mvn test
        }
        Set-Location ..
        Write-Success "Testes do Backend concluídos"
    }
    
    # Frontend tests
    if (Test-Path "frontend") {
        Write-Host "🧪 Executando testes do Frontend..." -ForegroundColor Yellow
        Set-Location frontend
        npm run test
        Set-Location ..
        Write-Success "Testes do Frontend concluídos"
    }
}

# ========================================
# INICIALIZAÇÃO DO BANCO DE DADOS
# ========================================
Write-Step "Inicializando banco de dados..."

# Verificar se PostgreSQL está rodando
if (Test-Port -Port $DatabasePort) {
    Write-Success "PostgreSQL já está rodando na porta $DatabasePort"
} else {
    Write-Host "🗄️  Iniciando PostgreSQL..." -ForegroundColor Yellow
    
    # Tentar iniciar com Docker
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker run -d --name envio-holerites-postgres `
            -e POSTGRES_DB=fluxbus `
            -e POSTGRES_USER=postgres `
            -e POSTGRES_PASSWORD=postgres `
            -p $DatabasePort`:5432 `
            postgres:15-alpine
        
        if (Wait-ForService -Port $DatabasePort -ServiceName "PostgreSQL") {
            Write-Success "PostgreSQL iniciado com sucesso"
        } else {
            Write-Error "Falha ao iniciar PostgreSQL"
            exit 1
        }
    } else {
        Write-Error "PostgreSQL não está rodando e Docker não está disponível"
        Write-Host "Por favor, inicie o PostgreSQL manualmente na porta $DatabasePort" -ForegroundColor Yellow
    }
}

# ========================================
# INICIALIZAÇÃO DO REDIS
# ========================================
Write-Step "Inicializando Redis..."

if (Test-Port -Port $RedisPort) {
    Write-Success "Redis já está rodando na porta $RedisPort"
} else {
    Write-Host "🔴 Iniciando Redis..." -ForegroundColor Yellow
    
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker run -d --name envio-holerites-redis `
            -p $RedisPort`:6379 `
            redis:7-alpine
        
        if (Wait-ForService -Port $RedisPort -ServiceName "Redis") {
            Write-Success "Redis iniciado com sucesso"
        } else {
            Write-Error "Falha ao iniciar Redis"
        }
    } else {
        Write-Warning "Redis não está rodando. Cache será desabilitado."
    }
}

# ========================================
# INICIALIZAÇÃO DO BACKEND
# ========================================
Write-Step "Iniciando Backend..."

if (Test-Port -Port $BackendPort) {
    Write-Success "Backend já está rodando na porta $BackendPort"
} else {
    Write-Host "⚙️  Iniciando Backend..." -ForegroundColor Yellow
    
    Set-Location backend
    
    # Configurar variáveis de ambiente
    $env:SPRING_PROFILES_ACTIVE = $Environment
    $env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:$DatabasePort/fluxbus"
    $env:SPRING_DATASOURCE_USERNAME = "postgres"
    $env:SPRING_DATASOURCE_PASSWORD = "postgres"
    $env:SPRING_REDIS_HOST = "localhost"
    $env:SPRING_REDIS_PORT = $RedisPort
    
    # Iniciar aplicação
    if (Test-Path "mvnw") {
        Start-Process -FilePath "./mvnw" -ArgumentList "spring-boot:run" -NoNewWindow
    } else {
        Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -NoNewWindow
    }
    
    Set-Location ..
    
    if (Wait-ForService -Port $BackendPort -ServiceName "Backend") {
        Write-Success "Backend iniciado com sucesso"
    } else {
        Write-Error "Falha ao iniciar Backend"
        exit 1
    }
}

# ========================================
# INICIALIZAÇÃO DO FRONTEND
# ========================================
Write-Step "Iniciando Frontend..."

if (Test-Port -Port $FrontendPort) {
    Write-Success "Frontend já está rodando na porta $FrontendPort"
} else {
    Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Yellow
    
    Set-Location frontend
    
    # Configurar variáveis de ambiente
    $env:VITE_API_URL = "http://localhost:$BackendPort/api"
    $env:VITE_WS_URL = "ws://localhost:$BackendPort/ws"
    
    # Iniciar aplicação
    Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
    
    Set-Location ..
    
    if (Wait-ForService -Port $FrontendPort -ServiceName "Frontend") {
        Write-Success "Frontend iniciado com sucesso"
    } else {
        Write-Error "Falha ao iniciar Frontend"
    }
}

# ========================================
# SERVIÇOS OPCIONAIS
# ========================================
if (-not $SkipMonitoring) {
    Write-Step "Iniciando serviços de monitoramento..."
    
    # Prometheus
    if (-not (Test-Port -Port $PrometheusPort)) {
        Write-Host "📊 Iniciando Prometheus..." -ForegroundColor Yellow
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            docker run -d --name envio-holerites-prometheus `
                -p $PrometheusPort`:9090 `
                prom/prometheus:latest
        }
    }
    
    # Grafana
    if (-not (Test-Port -Port $GrafanaPort)) {
        Write-Host "📈 Iniciando Grafana..." -ForegroundColor Yellow
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            docker run -d --name envio-holerites-grafana `
                -e GF_SECURITY_ADMIN_PASSWORD=admin123 `
                -p $GrafanaPort`:3000 `
                grafana/grafana:latest
        }
    }
    
    # Elasticsearch
    if (-not (Test-Port -Port $ElasticsearchPort)) {
        Write-Host "🔍 Iniciando Elasticsearch..." -ForegroundColor Yellow
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            docker run -d --name envio-holerites-elasticsearch `
                -e "discovery.type=single-node" `
                -e "xpack.security.enabled=false" `
                -p $ElasticsearchPort`:9200 `
                docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        }
    }
    
    # Kibana
    if (-not (Test-Port -Port $KibanaPort)) {
        Write-Host "📊 Iniciando Kibana..." -ForegroundColor Yellow
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            docker run -d --name envio-holerites-kibana `
                -e ELASTICSEARCH_HOSTS=http://localhost:$ElasticsearchPort `
                -p $KibanaPort`:5601 `
                docker.elastic.co/kibana/kibana:8.11.0
        }
    }
}

# ========================================
# SERVIÇOS DE WHATSAPP
# ========================================
Write-Step "Iniciando serviços de WhatsApp..."

# WPPConnect
if (-not (Test-Port -Port $WPPConnectPort)) {
    Write-Host "📱 Iniciando WPPConnect..." -ForegroundColor Yellow
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker run -d --name envio-holerites-wppconnect `
            -e SECRET_KEY=your-secret-key-here `
            -e CORS_ORIGIN="*" `
            -p $WPPConnectPort`:8080 `
            wppconnect/wppconnect:latest
    }
}

# Baileys
if (-not (Test-Port -Port $BaileysPort)) {
    Write-Host "📱 Iniciando Baileys..." -ForegroundColor Yellow
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker run -d --name envio-holerites-baileys `
            -e NODE_ENV=development `
            -e PORT=3000 `
            -p $BaileysPort`:3000 `
            baileys-whatsapp:latest
    }
}

# N8N
if (-not (Test-Port -Port $N8nPort)) {
    Write-Host "🤖 Iniciando N8N..." -ForegroundColor Yellow
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker run -d --name envio-holerites-n8n `
            -e N8N_BASIC_AUTH_ACTIVE=true `
            -e N8N_BASIC_AUTH_USER=admin `
            -e N8N_BASIC_AUTH_PASSWORD=admin123 `
            -p $N8nPort`:5678 `
            n8nio/n8n:latest
    }
}

# ========================================
# RESUMO FINAL
# ========================================
Write-Host "`n🎉 SISTEMA INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

Write-Host "`n📋 Serviços Ativos:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:     http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "   ⚙️  Backend:      http://localhost:$BackendPort" -ForegroundColor White
Write-Host "   🗄️  Database:     localhost:$DatabasePort" -ForegroundColor White
Write-Host "   🔴 Redis:        localhost:$RedisPort" -ForegroundColor White

if (-not $SkipMonitoring) {
    Write-Host "`n📊 Monitoramento:" -ForegroundColor Cyan
    Write-Host "   📈 Grafana:     http://localhost:$GrafanaPort (admin/admin123)" -ForegroundColor White
    Write-Host "   📊 Prometheus:  http://localhost:$PrometheusPort" -ForegroundColor White
    Write-Host "   🔍 Elasticsearch: http://localhost:$ElasticsearchPort" -ForegroundColor White
    Write-Host "   📊 Kibana:      http://localhost:$KibanaPort" -ForegroundColor White
}

Write-Host "`n📱 WhatsApp:" -ForegroundColor Cyan
Write-Host "   📱 WPPConnect:   http://localhost:$WPPConnectPort" -ForegroundColor White
Write-Host "   📱 Baileys:      http://localhost:$BaileysPort" -ForegroundColor White
Write-Host "   🤖 N8N:          http://localhost:$N8nPort (admin/admin123)" -ForegroundColor White

Write-Host "`n🔧 Comandos Úteis:" -ForegroundColor Cyan
Write-Host "   📋 Status:       docker ps" -ForegroundColor White
Write-Host "   🛑 Parar:        docker stop envio-holerites-*" -ForegroundColor White
Write-Host "   🗑️  Limpar:       docker rm envio-holerites-*" -ForegroundColor White
Write-Host "   📊 Logs:         docker logs envio-holerites-backend" -ForegroundColor White

Write-Host "`n🚀 Próximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Acesse o Frontend e faça login" -ForegroundColor White
Write-Host "   2. Configure o WhatsApp no N8N" -ForegroundColor White
Write-Host "   3. Configure os dashboards no Grafana" -ForegroundColor White
Write-Host "   4. Teste o envio de holerites" -ForegroundColor White

Write-Host "`n✨ Sistema pronto para uso!" -ForegroundColor Green 