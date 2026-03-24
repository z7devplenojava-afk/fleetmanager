#!/usr/bin/env pwsh
# ================================================
# Script para testar WhatsApp Service localmente
# ================================================

Write-Host "📱 Testando WhatsApp Service Local" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Variáveis
$SERVICE_DIR = "whatsapp-service"
$PORT = 3333

# Verificar se o diretório existe
if (-not (Test-Path $SERVICE_DIR)) {
    Write-Host "❌ Diretório $SERVICE_DIR não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Navegando para $SERVICE_DIR..." -ForegroundColor Yellow
Set-Location $SERVICE_DIR

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Iniciando WhatsApp Service..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Endpoints disponíveis:" -ForegroundColor Cyan
Write-Host "  - Health: http://localhost:$PORT/health" -ForegroundColor White
Write-Host "  - QR Code SVG: http://localhost:$PORT/instance/qr" -ForegroundColor White
Write-Host "  - QR Code Base64: http://localhost:$PORT/instance/qr?format=base64" -ForegroundColor White
Write-Host "  - Connection State: http://localhost:$PORT/instance/connectionState" -ForegroundColor White
Write-Host "  - Debug JID: http://localhost:$PORT/debug/jid?id=5511999999999" -ForegroundColor White
Write-Host "  - Inbox: http://localhost:$PORT/debug/inbox" -ForegroundColor White
Write-Host ""
Write-Host "💡 Para enviar mensagem de teste:" -ForegroundColor Yellow
Write-Host '  curl -X POST http://localhost:3333/message/text \' -ForegroundColor White
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor White
Write-Host '    -d "{\"id\":\"5511999999999\",\"message\":\"Teste\"}"' -ForegroundColor White
Write-Host ""
Write-Host "💡 Para parar o serviço: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar o serviço
npm start

