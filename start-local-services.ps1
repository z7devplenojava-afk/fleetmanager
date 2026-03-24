# Script PowerShell para iniciar serviços locais do Secured Guard
# Uso: .\start-local-services.ps1

Write-Host "🚀 Iniciando serviços locais do Secured Guard..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando! Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar se docker-compose está disponível
Write-Host "🔍 Verificando Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose está disponível" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose não está disponível!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Iniciando serviços (PostgreSQL, Redis, MinIO, WhatsApp)..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up -d postgres redis minio whatsapp

Write-Host ""
Write-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Status dos serviços:" -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml ps

Write-Host ""
Write-Host "🔍 Verificando saúde dos serviços..." -ForegroundColor Yellow

# Verificar PostgreSQL
Write-Host "  PostgreSQL..." -NoNewline
try {
    $pgResult = docker exec secured-guard-local-db pg_isready -U dev_user 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Ainda inicializando..." -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠️  Container não encontrado ou ainda inicializando" -ForegroundColor Yellow
}

# Verificar Redis
Write-Host "  Redis..." -NoNewline
try {
    $redisResult = docker exec secured-guard-local-redis redis-cli ping 2>&1
    if ($redisResult -match "PONG") {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Ainda inicializando..." -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠️  Container não encontrado ou ainda inicializando" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Serviços iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Configure o perfil Spring: SPRING_PROFILES_ACTIVE=local" -ForegroundColor White
Write-Host "  2. Inicie o backend pela sua IDE" -ForegroundColor White
Write-Host "  3. O backend vai conectar em:" -ForegroundColor White
Write-Host "     - PostgreSQL: localhost:5432" -ForegroundColor Gray
Write-Host "     - Redis: localhost:6379" -ForegroundColor Gray
Write-Host "     - MinIO: localhost:9000" -ForegroundColor Gray
Write-Host "     - WhatsApp: localhost:3333" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Para ver logs: docker-compose -f docker-compose.local.yml logs -f [servico]" -ForegroundColor Cyan
Write-Host "💡 Para parar: docker-compose -f docker-compose.local.yml down" -ForegroundColor Cyan

