# Teste do Sistema de Envio de Holerites
# Execute este script para testar o fluxo completo

Write-Host "🧪 TESTE DO SISTEMA DE ENVIO DE HOLERITES" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

$baseUrl = "http://localhost:8081"

# 1. Testar endpoint de logs (deve retornar vazio inicialmente)
Write-Host "`n1. Testando endpoint de logs..." -ForegroundColor Cyan
try {
    $logsResponse = Invoke-RestMethod -Uri "$baseUrl/api/envio/logs?cpf=12345678901" -Method GET
    Write-Host "✅ Logs endpoint funcionando - encontrados: $($logsResponse.Count) logs" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao testar logs: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar envio individual (simulado)
Write-Host "`n2. Testando envio individual..." -ForegroundColor Cyan
$individualPayload = @{
    tipo = "whatsapp"
    funcionarioId = "550e8400-e29b-41d4-a716-446655440000"  # UUID de exemplo
    mensagem = "Teste de envio via PowerShell"
} | ConvertTo-Json

try {
    $individualResponse = Invoke-RestMethod -Uri "$baseUrl/api/envio/individual" -Method POST -Body $individualPayload -ContentType "application/json"
    Write-Host "✅ Envio individual testado - Sucesso: $($individualResponse.sucesso)" -ForegroundColor Green
    Write-Host "   Total enviados: $($individualResponse.totalEnviados)" -ForegroundColor White
    Write-Host "   Total falhas: $($individualResponse.totalFalhas)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro no envio individual: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar envio em massa (simulado)
Write-Host "`n3. Testando envio em massa..." -ForegroundColor Cyan
$batchPayload = @{
    tipo = "email"
    funcionarioIds = @("550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001")
    assunto = "Teste de envio em massa"
    mensagem = "Teste de envio em massa via PowerShell"
} | ConvertTo-Json

try {
    $batchResponse = Invoke-RestMethod -Uri "$baseUrl/api/envio/massa" -Method POST -Body $batchPayload -ContentType "application/json"
    Write-Host "✅ Envio em massa testado - Sucesso: $($batchResponse.sucesso)" -ForegroundColor Green
    Write-Host "   Total enviados: $($batchResponse.totalEnviados)" -ForegroundColor White
    Write-Host "   Total falhas: $($batchResponse.totalFalhas)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro no envio em massa: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Verificar logs após envios
Write-Host "`n4. Verificando logs após envios..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
try {
    $logsAfterResponse = Invoke-RestMethod -Uri "$baseUrl/api/envio/logs?cpf=12345678901" -Method GET
    Write-Host "✅ Logs encontrados após envios: $($logsAfterResponse.Count)" -ForegroundColor Green
    
    if ($logsAfterResponse.Count -gt 0) {
        Write-Host "   Último log:" -ForegroundColor White
        $lastLog = $logsAfterResponse[-1]
        Write-Host "   - CPF: $($lastLog.cpf)" -ForegroundColor Gray
        Write-Host "   - Canal: $($lastLog.channel)" -ForegroundColor Gray
        Write-Host "   - Status: $(if($lastLog.success) {'Sucesso'} else {'Falha'})" -ForegroundColor Gray
        Write-Host "   - Tentativas: $($lastLog.attempts)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erro ao verificar logs: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Testar verificação de WhatsApp
Write-Host "`n5. Testando verificação de WhatsApp..." -ForegroundColor Cyan
try {
    $whatsappResponse = Invoke-RestMethod -Uri "$baseUrl/api/envio/verificar-whatsapp/12345678901" -Method GET
    Write-Host "✅ Verificação WhatsApp - Tem WhatsApp: $($whatsappResponse.temWhatsApp)" -ForegroundColor Green
    if ($whatsappResponse.numeroWhatsApp) {
        Write-Host "   Número: $($whatsappResponse.numeroWhatsApp)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erro na verificação WhatsApp: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Testar saúde do Baileys
Write-Host "`n6. Testando conexão Baileys..." -ForegroundColor Cyan
try {
    $baileysResponse = Invoke-RestMethod -Uri "$baseUrl/api/baileys/connection-state" -Method GET
    Write-Host "✅ Baileys conectado: $($baileysResponse.connected)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Baileys não configurado ou indisponível (normal em desenvolvimento)" -ForegroundColor Yellow
}

Write-Host "`n🎯 TESTE CONCLUÍDO!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "Para testar no frontend:" -ForegroundColor Cyan
Write-Host "1. Acesse: http://localhost:8080/holerites" -ForegroundColor White
Write-Host "2. Vá na aba 'Comprovantes'" -ForegroundColor White
Write-Host "3. Selecione alguns comprovantes" -ForegroundColor White
Write-Host "4. Clique 'Email' ou 'WhatsApp'" -ForegroundColor White
Write-Host "5. Veja os resultados na aba 'Logs de Envio'" -ForegroundColor White
Write-Host ""
Write-Host "📝 Nota: Os envios podem falhar se não houver funcionários cadastrados" -ForegroundColor Yellow
Write-Host "   ou WhatsApp/email configurados. Isso é normal e os logs serão registrados." -ForegroundColor Yellow
