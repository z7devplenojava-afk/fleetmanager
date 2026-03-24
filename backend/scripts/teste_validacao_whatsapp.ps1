# ========================================
# TESTE DE VALIDAÇÃO WHATSAPP
# ========================================

Write-Host "🔍 TESTANDO VALIDAÇÃO DE WHATSAPP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# 1. Testar verificação de WhatsApp para um CPF específico
$cpfTeste = "02047566690"  # CPF do primeiro funcionário do JSON
Write-Host "`n📱 Testando CPF: $cpfTeste" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/envio/verificar-whatsapp/$cpfTeste" -Method GET
    Write-Host "✅ Resposta:" -ForegroundColor Green
    Write-Host "   CPF: $($response.cpf)" -ForegroundColor White
    Write-Host "   Tem WhatsApp: $($response.temWhatsApp)" -ForegroundColor White
    Write-Host "   Número: $($response.numeroWhatsApp)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro ao testar: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar envio individual via WhatsApp
Write-Host "`n📤 Testando envio individual via WhatsApp..." -ForegroundColor Yellow

$envioRequest = @{
    tipo = "whatsapp"
    funcionarioId = "1"  # ID do funcionário (será substituído pelo ID real)
    mensagem = "Teste de envio via WhatsApp - Holerite disponível!"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/envio/individual" -Method POST -Body ($envioRequest | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Resposta do envio:" -ForegroundColor Green
    Write-Host "   Sucesso: $($response.sucesso)" -ForegroundColor White
    Write-Host "   Mensagem: $($response.mensagem)" -ForegroundColor White
    if ($response.detalhes) {
        Write-Host "   Detalhes:" -ForegroundColor White
        foreach ($detalhe in $response.detalhes) {
            Write-Host "     - $($detalhe.nome): $($detalhe.enviado) - $($detalhe.erro)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Erro no envio: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Teste concluído!" -ForegroundColor Green 