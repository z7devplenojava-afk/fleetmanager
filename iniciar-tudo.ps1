# Script de Inicialização Completo - FluxBus
# Execute: .\iniciar-tudo.ps1

param(
    [switch]$SkipDocker,
    [switch]$SkipQR
)

$ErrorActionPreference = "Continue"

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   FLUXBUS - INICIALIZAÇÃO" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# 1. Verificar se Docker está rodando
if (-not $SkipDocker) {
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
}

# 2. Parar containers existentes
Write-Host "2️⃣ Limpando containers antigos..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "   ✅ Containers parados`n" -ForegroundColor Green

# 3. Verificar estrutura de pastas
Write-Host "3️⃣ Verificando estrutura de pastas..." -ForegroundColor Yellow
if (-not (Test-Path "backend\holerites\9-2025")) {
    New-Item -Path "backend\holerites\9-2025" -ItemType Directory -Force | Out-Null
    Write-Host "   ✅ Pasta criada: backend\holerites\9-2025" -ForegroundColor Green
} else {
    Write-Host "   ✅ Pasta já existe`n" -ForegroundColor Green
}

# 4. Criar rede Docker
Write-Host "4️⃣ Criando rede Docker..." -ForegroundColor Yellow
docker network create fluxbus 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Rede criada`n" -ForegroundColor Green
} else {
    Write-Host "   ✅ Rede já existe`n" -ForegroundColor Green
}

# 5. Iniciar serviços
Write-Host "5️⃣ Iniciando serviços..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "   ✅ Serviços iniciados`n" -ForegroundColor Green

# 6. Aguardar inicialização
Write-Host "6️⃣ Aguardando serviços inicializarem..." -ForegroundColor Yellow
for ($i = 30; $i -gt 0; $i--) {
    Write-Host "   ⏳ $i segundos restantes..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
}
Write-Host "   ✅ Pronto!`n" -ForegroundColor Green

# 7. Verificar status
Write-Host "7️⃣ Verificando status dos serviços..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}}" | Where-Object { $_ -match "whatsapp|postgres|redis" }

if ($containers.Count -ge 3) {
    Write-Host "   ✅ Todos os containers rodando:`n" -ForegroundColor Green
    docker ps --filter "name=whatsapp-service" --format "      📱 {{.Names}} - {{.Status}}"
    docker ps --filter "name=postgres" --format "      🗄️  {{.Names}} - {{.Status}}"
    docker ps --filter "name=redis" --format "      💾 {{.Names}} - {{.Status}}"
    Write-Host ""
} else {
    Write-Host "   ⚠️ Alguns containers não iniciaram!" -ForegroundColor Yellow
    Write-Host "   Execute: docker-compose ps`n" -ForegroundColor Gray
}

# 8. Aguardar WhatsApp gerar QR Code
if (-not $SkipQR) {
    Write-Host "8️⃣ Aguardando WhatsApp gerar QR Code..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Tentar obter QR Code
    $qrObtido = $false
    for ($i = 1; $i -le 15; $i++) {
        try {
            Write-Host "   [$i/15] Tentando obter QR Code..." -NoNewline
            
            $response = Invoke-WebRequest -Uri "http://localhost:3333/instance/qr" `
                -OutFile "qr-code.svg" `
                -ErrorAction Stop `
                -TimeoutSec 5
            
            if (Test-Path "qr-code.svg") {
                Write-Host " ✅" -ForegroundColor Green
                $qrObtido = $true
                break
            }
        } catch {
            Write-Host " ⏳" -ForegroundColor Gray
        }
        Start-Sleep -Seconds 3
    }
    
    if ($qrObtido) {
        Write-Host "`n   ✅ QR Code salvo em: qr-code.svg" -ForegroundColor Green
        Write-Host "   🌐 Abrindo no navegador...`n" -ForegroundColor Cyan
        Start-Process "qr-code.svg"
    } else {
        Write-Host "`n   ⚠️ QR Code não gerado automaticamente" -ForegroundColor Yellow
        Write-Host "   Execute: Invoke-WebRequest -Uri 'http://localhost:3333/instance/qr' -OutFile 'qr.svg'; Start-Process 'qr.svg'`n" -ForegroundColor Gray
    }
}

# 9. Resumo final
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✅ INICIALIZAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "📊 Status:" -ForegroundColor White
Write-Host "   🗄️  PostgreSQL: localhost:5433" -ForegroundColor Gray
Write-Host "   💾 Redis: localhost:6379" -ForegroundColor Gray
Write-Host "   📱 WhatsApp: localhost:3333" -ForegroundColor Gray

Write-Host "`n📱 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Escaneie o QR Code com WhatsApp" -ForegroundColor White
Write-Host "   2. Aguarde mensagem: 'WhatsApp connected and ready!'" -ForegroundColor White
Write-Host "   3. Teste o envio no frontend" -ForegroundColor White

Write-Host "`n🔍 Comandos Úteis:" -ForegroundColor Cyan
Write-Host "   Ver logs: docker logs -f whatsapp-service" -ForegroundColor Gray
Write-Host "   Status: docker ps" -ForegroundColor Gray
Write-Host "   Parar: docker-compose down" -ForegroundColor Gray

Write-Host "`n════════════════════════════════════════`n" -ForegroundColor Cyan

