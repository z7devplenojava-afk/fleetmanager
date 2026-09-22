# Script de Teste Completo - Baileys WhatsApp
# Execute: .\testar-whatsapp.ps1

param(
    [string]$PhoneNumber = ""  # Ex: 5511999999999
)

$WHATSAPP_URL = "http://localhost:3333"

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   TESTE COMPLETO - WHATSAPP BAILEYS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# 1. Verificar Status
Write-Host "1️⃣ Verificando status da conexão..." -ForegroundColor Yellow
$state = Invoke-RestMethod -Uri "$WHATSAPP_URL/instance/connectionState"
$health = Invoke-RestMethod -Uri "$WHATSAPP_URL/health"

if ($state.state -eq "open" -and $health.ready -eq $true) {
    Write-Host "   ✅ WhatsApp conectado e pronto!`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ WhatsApp não está conectado!" -ForegroundColor Red
    Write-Host "   Estado: $($state.state)" -ForegroundColor Gray
    Write-Host "   Pronto: $($health.ready)`n" -ForegroundColor Gray
    exit 1
}

# 2. Testar envio de mensagem
if ($PhoneNumber) {
    Write-Host "2️⃣ Testando envio de mensagem..." -ForegroundColor Yellow
    
    $body = @{
        id = $PhoneNumber
        message = "🎉 Teste automático do Baileys WhatsApp!`n`n✅ Sistema: FluxBus`n📅 Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm')`n🚀 Status: Operacional"
    } | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod -Uri "$WHATSAPP_URL/message/text" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body
        
        if ($result.success) {
            Write-Host "   ✅ Mensagem enviada com sucesso!`n" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Falha ao enviar mensagem`n" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Erro: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "2️⃣ Teste de envio de mensagem (PULADO)" -ForegroundColor Gray
    Write-Host "   Para testar, execute:" -ForegroundColor White
    Write-Host "   .\testar-whatsapp.ps1 -PhoneNumber 5511999999999`n" -ForegroundColor Cyan
}

# 3. Resumo
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✅ TESTE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "📊 Resumo:" -ForegroundColor White
Write-Host "   URL: $WHATSAPP_URL" -ForegroundColor Gray
Write-Host "   Estado: $($state.state)" -ForegroundColor Gray
Write-Host "   Pronto: $($health.ready)" -ForegroundColor Gray

Write-Host "`n📚 Endpoints disponíveis:" -ForegroundColor White
Write-Host "   GET  /health" -ForegroundColor Gray
Write-Host "   GET  /instance/connectionState" -ForegroundColor Gray
Write-Host "   GET  /instance/qr" -ForegroundColor Gray
Write-Host "   POST /message/text" -ForegroundColor Gray
Write-Host "   POST /message/document" -ForegroundColor Gray
Write-Host "   POST /instance/logout" -ForegroundColor Gray

Write-Host "`n🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Testar envio de mensagem (use -PhoneNumber)" -ForegroundColor White
Write-Host "   2. Integrar com backend Spring Boot" -ForegroundColor White
Write-Host "   3. Testar envio de holerites/documentos`n" -ForegroundColor White

