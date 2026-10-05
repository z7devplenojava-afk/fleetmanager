# Script para iniciar Backend + WhatsApp Service
# Execute: .\iniciar-backend-com-whatsapp.ps1

$ErrorActionPreference = "Continue"

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   FLUXBUS - BACKEND + WHATSAPP" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# 1. Verificar se Docker está rodando
Write-Host "1️⃣ Verificando Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker ps | Out-Null
    $dockerRunning = $true
    Write-Host "   ✅ Docker está rodando`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "   Por favor, inicie o Docker Desktop e execute este script novamente`n" -ForegroundColor Yellow
    exit 1
}

# 2. Criar rede Docker se não existir
Write-Host "2️⃣ Verificando rede Docker..." -ForegroundColor Yellow
docker network create fluxbus 2>$null | Out-Null
Write-Host "   ✅ Rede verificada`n" -ForegroundColor Green

# 3. Iniciar serviços Docker (PostgreSQL, Redis, WhatsApp)
Write-Host "3️⃣ Iniciando serviços Docker (PostgreSQL, Redis, WhatsApp)..." -ForegroundColor Yellow
docker compose up -d postgres redis whatsapp-service
Write-Host "   ✅ Serviços Docker iniciados`n" -ForegroundColor Green

# 4. Aguardar serviços Docker inicializarem
Write-Host "4️⃣ Aguardando serviços Docker inicializarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "   ✅ Pronto!`n" -ForegroundColor Green

# 5. Verificar se backend já está rodando
Write-Host "5️⃣ Verificando se backend já está rodando..." -ForegroundColor Yellow
$backendPort = 8083
$backendRunning = $false

try {
    $connection = Test-NetConnection -ComputerName localhost -Port $backendPort -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($connection) {
        Write-Host "   ⚠️ Backend já está rodando na porta $backendPort" -ForegroundColor Yellow
        Write-Host "   Deseja reiniciar? (S/N): " -NoNewline -ForegroundColor Yellow
        $response = Read-Host
        if ($response -eq "S" -or $response -eq "s") {
            Write-Host "   🛑 Parando backend..." -ForegroundColor Yellow
            # Encontrar e parar processo Java na porta 8083
            $process = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue | 
                Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 2
            }
        } else {
            Write-Host "   ✅ Mantendo backend atual`n" -ForegroundColor Green
            $backendRunning = $true
        }
    }
} catch {
    # Porta não está em uso, pode continuar
}

# 6. Iniciar Backend
if (-not $backendRunning) {
    Write-Host "6️⃣ Iniciando Backend..." -ForegroundColor Yellow
    
    Set-Location backend
    
    # Verificar se mvnw existe
    if (Test-Path "mvnw.cmd") {
        Write-Host "   ⚙️  Iniciando com Maven Wrapper..." -ForegroundColor Gray
        Start-Process -FilePath ".\mvnw.cmd" -ArgumentList "spring-boot:run" -NoNewWindow
    } elseif (Test-Path "mvnw") {
        Write-Host "   ⚙️  Iniciando com Maven Wrapper..." -ForegroundColor Gray
        Start-Process -FilePath ".\mvnw" -ArgumentList "spring-boot:run" -NoNewWindow
    } else {
        Write-Host "   ⚙️  Iniciando com Maven..." -ForegroundColor Gray
        Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -NoNewWindow
    }
    
    Set-Location ..
    
    # Aguardar backend iniciar
    Write-Host "   ⏳ Aguardando backend iniciar..." -ForegroundColor Gray
    $maxAttempts = 60
    $attempt = 0
    $backendReady = $false
    
    while ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $backendPort -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($connection) {
                $backendReady = $true
                break
            }
        } catch {
            # Continuar tentando
        }
        if ($attempt % 10 -eq 0) {
            Write-Host "   ⏳ Ainda aguardando... ($attempt/$maxAttempts)" -ForegroundColor Gray
        }
    }
    
    if ($backendReady) {
        Write-Host "   ✅ Backend iniciado com sucesso na porta $backendPort`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Backend pode não ter iniciado completamente" -ForegroundColor Yellow
        Write-Host "   Verifique os logs manualmente`n" -ForegroundColor Gray
    }
} else {
    Write-Host "6️⃣ Backend já está rodando, pulando inicialização`n" -ForegroundColor Green
}

# 7. Verificar status dos serviços
Write-Host "7️⃣ Verificando status dos serviços..." -ForegroundColor Yellow
Write-Host ""

# Verificar PostgreSQL
$postgresRunning = docker ps --filter "name=postgres" --format "{{.Names}}" | Select-String "postgres"
if ($postgresRunning) {
    Write-Host "   ✅ PostgreSQL: Rodando" -ForegroundColor Green
} else {
    Write-Host "   ❌ PostgreSQL: Não está rodando" -ForegroundColor Red
}

# Verificar Redis
$redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" | Select-String "redis"
if ($redisRunning) {
    Write-Host "   ✅ Redis: Rodando" -ForegroundColor Green
} else {
    Write-Host "   ❌ Redis: Não está rodando" -ForegroundColor Red
}

# Verificar WhatsApp Service
$whatsappRunning = docker ps --filter "name=whatsapp-service" --format "{{.Names}}" | Select-String "whatsapp"
if ($whatsappRunning) {
    Write-Host "   ✅ WhatsApp Service: Rodando" -ForegroundColor Green
} else {
    Write-Host "   ❌ WhatsApp Service: Não está rodando" -ForegroundColor Red
}

# Verificar Backend
try {
    $backendConnection = Test-NetConnection -ComputerName localhost -Port $backendPort -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($backendConnection) {
        Write-Host "   ✅ Backend: Rodando na porta $backendPort" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend: Não está rodando" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Backend: Não está rodando" -ForegroundColor Red
}

Write-Host ""

# 8. Resumo final
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✅ INICIALIZAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "📊 Serviços:" -ForegroundColor White
Write-Host "   🗄️  PostgreSQL: localhost:5433" -ForegroundColor Gray
Write-Host "   💾 Redis: localhost:6379" -ForegroundColor Gray
Write-Host "   📱 WhatsApp: localhost:3333" -ForegroundColor Gray
Write-Host "   ⚙️  Backend: localhost:$backendPort" -ForegroundColor Gray

Write-Host "`n🔍 Comandos Úteis:" -ForegroundColor Cyan
Write-Host "   Ver logs WhatsApp: docker logs -f whatsapp-service" -ForegroundColor Gray
Write-Host "   Ver containers: docker ps" -ForegroundColor Gray
Write-Host "   Parar serviços: docker compose down" -ForegroundColor Gray
Write-Host "   Status backend: http://localhost:$backendPort/api/health" -ForegroundColor Gray

Write-Host "`n════════════════════════════════════════`n" -ForegroundColor Cyan

