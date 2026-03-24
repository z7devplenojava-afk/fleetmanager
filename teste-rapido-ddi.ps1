# ========================================
# TESTE RÁPIDO: DDI 55 no Baileys
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE: ENVIO COM DDI 55" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Teste 1: SEM DDI (comportamento antigo - redireciona)
Write-Host "1. Testando SEM DDI (deve redirecionar)..." -ForegroundColor Yellow
$headers = @{ 'Content-Type' = 'application/json' }
$body = @{
    id = "31997142303"  # SEM DDI
    message = "Teste SEM DDI - deve redirecionar"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3333/message/text" -Method POST -Headers $headers -Body $body | Out-Null
    Write-Host "   ✅ Enviado (verificar se chegou em 31971731747 ou 31997142303)" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Erro: $_" -ForegroundColor Red
}
Write-Host ""

Start-Sleep 3

# Teste 2: COM DDI (comportamento correto - envia pro destinatário)
Write-Host "2. Testando COM DDI 55 (deve enviar correto)..." -ForegroundColor Yellow
$body2 = @{
    id = "5531997142303"  # COM DDI
    message = "Teste COM DDI 55 - deve chegar correto!"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3333/message/text" -Method POST -Headers $headers -Body $body2 | Out-Null
    Write-Host "   ✅ Enviado (verificar se chegou em 31997142303)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VALIDAÇÃO:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifique nos WhatsApp:" -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 31971731747 (conectado):" -ForegroundColor Cyan
Write-Host "   - Deve receber: Teste SEM DDI (redirecionado)" -ForegroundColor White
Write-Host ""
Write-Host "📱 31997142303 (destinatário):" -ForegroundColor Cyan
Write-Host "   - Deve receber: Teste COM DDI 55 (correto!)" -ForegroundColor Green
Write-Host ""
Write-Host "Se a mensagem COM DDI chegou no destinatário correto," -ForegroundColor Yellow
Write-Host "a solução está FUNCIONANDO!" -ForegroundColor Green
Write-Host ""

