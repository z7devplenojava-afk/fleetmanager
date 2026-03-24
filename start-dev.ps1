# ========================================
# SECURED GUARD - Script de Inicialização Desenvolvimento (PowerShell)
# ========================================

Write-Host "🚀 Iniciando Secured Guard - Ambiente de Desenvolvimento" -ForegroundColor Cyan
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

# Parar containers existentes (se houver)
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down | Out-Null

Write-Host ""
Write-Host "🐳 Iniciando serviços Docker..." -ForegroundColor Cyan
Write-Host "   - PostgreSQL (porta 5432)"
Write-Host "   - Redis (porta 6379)"
Write-Host "   - MinIO (portas 9000, 9001)"
Write-Host "   - WhatsApp Service (porta 3333)"
Write-Host ""

# Iniciar containers
docker-compose -f docker-compose.dev.yml up -d

# Aguardar serviços ficarem prontos
Write-Host ""
Write-Host "⏳ Aguardando serviços ficarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar status dos serviços
Write-Host ""
Write-Host "📊 Status dos Serviços:" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL
try {
    docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres | Out-Null
    Write-Host "✅ PostgreSQL: Pronto" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL: Aguardando..." -ForegroundColor Yellow
}

# Redis
try {
    docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping | Out-Null
    Write-Host "✅ Redis: Pronto" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Redis: Aguardando..." -ForegroundColor Yellow
}

# WhatsApp Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3333/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ WhatsApp Service: Pronto" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  WhatsApp Service: Aguardando..." -ForegroundColor Yellow
}

# MinIO
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ MinIO: Pronto" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  MinIO: Aguardando..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Serviços Docker iniciados com sucesso!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar o Backend:"
Write-Host "   cd backend && mvn spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "2. Iniciar o Frontend:"
Write-Host "   cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Acessar o sistema:"
Write-Host "   🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   🔧 Backend API: http://localhost:8083" -ForegroundColor Cyan
Write-Host "   📦 MinIO Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Conectar WhatsApp:"
Write-Host "   Acesse: Configurações > Conexão WhatsApp"
Write-Host "   Clique em 'Gerar QR Code' e escaneie"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Comandos úteis:" -ForegroundColor Yellow
Write-Host "   Ver logs: docker-compose -f docker-compose.dev.yml logs -f"
Write-Host "   Parar: docker-compose -f docker-compose.dev.yml down"
Write-Host "   Status: docker-compose -f docker-compose.dev.yml ps"
Write-Host ""
Write-Host "📚 Documentação completa: DOCKER_COMPOSE_GUIDE.md" -ForegroundColor Cyan
Write-Host ""





























