# ============================================
# FLUXBUS - Ambiente Local (PowerShell)
# Inicia TODO o sistema dockerizado
# ============================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "🏠 FLUXBUS - Ambiente Local" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Verificar se Docker está rodando
try {
    docker info | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "Por favor, inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar se env.local.template existe e copiar se necessário
if (-not (Test-Path ".env.local")) {
    if (Test-Path "env.local.template") {
        Write-Host "⚠️  Arquivo .env.local não encontrado" -ForegroundColor Yellow
        Write-Host "Copiando de env.local.template..." -ForegroundColor Yellow
        Copy-Item "env.local.template" ".env.local"
        Write-Host "✅ Arquivo .env.local criado" -ForegroundColor Green
        Write-Host ""
    }
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down 2>$null
Write-Host ""

# Construir imagens
Write-Host "🔨 Construindo imagens Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml build
Write-Host ""

# Iniciar serviços
Write-Host "🚀 Iniciando serviços..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d
Write-Host ""

# Aguardar serviços
Write-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

# Verificar status
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "📊 Status dos Serviços:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Verificar PostgreSQL
try {
    docker exec fluxbus-local-db pg_isready -U dev_user | Out-Null
    Write-Host "✅ PostgreSQL: fluxbus-local-db (porta 5432)" -ForegroundColor Green
} catch {
    Write-Host "⏳ PostgreSQL: Iniciando..." -ForegroundColor Yellow
}

# Verificar Redis
try {
    docker exec fluxbus-local-redis redis-cli ping | Out-Null
    Write-Host "✅ Redis: fluxbus-local-redis (porta 6379)" -ForegroundColor Green
} catch {
    Write-Host "⏳ Redis: Iniciando..." -ForegroundColor Yellow
}

# Verificar MinIO
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ MinIO: fluxbus-local-minio (portas 9000, 9001)" -ForegroundColor Green
    }
} catch {
    Write-Host "⏳ MinIO: Iniciando..." -ForegroundColor Yellow
}

# Verificar WhatsApp
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3333/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ WhatsApp: fluxbus-local-whatsapp (porta 3333)" -ForegroundColor Green
    }
} catch {
    Write-Host "⏳ WhatsApp: Iniciando..." -ForegroundColor Yellow
}

# Verificar Backend
Start-Sleep -Seconds 20
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/api/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend: fluxbus-local-backend (porta 8083)" -ForegroundColor Green
    }
} catch {
    Write-Host "⏳ Backend: Iniciando (pode demorar ~60s)..." -ForegroundColor Yellow
}

# Verificar Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend: fluxbus-local-frontend (porta 3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "⏳ Frontend: Iniciando..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "✅ Ambiente Local Iniciado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 URLs de Acesso:" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend API:   http://localhost:8083" -ForegroundColor Cyan
Write-Host "  Swagger UI:    http://localhost:8083/swagger-ui.html" -ForegroundColor Cyan
Write-Host "  MinIO Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host "                 (minioadmin/minioadmin)" -ForegroundColor DarkGray
Write-Host "  WhatsApp API:  http://localhost:3333/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "💾 Banco de Dados:" -ForegroundColor Green
Write-Host ""
Write-Host "  Host:     localhost"
Write-Host "  Port:     5432"
Write-Host "  Database: fluxbus_local"
Write-Host "  User:     dev_user"
Write-Host "  Password: dev_pass"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Comandos Úteis:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Ver logs:       docker-compose -f docker-compose.local.yml logs -f"
Write-Host "  Parar:          docker-compose -f docker-compose.local.yml down"
Write-Host "  Reiniciar:      docker-compose -f docker-compose.local.yml restart"
Write-Host "  Status:         docker-compose -f docker-compose.local.yml ps"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Abrir browser (opcional)
$open = Read-Host "Abrir browser automaticamente? (s/n)"
if ($open -eq "s") {
    Start-Process "http://localhost:3000"
}





























