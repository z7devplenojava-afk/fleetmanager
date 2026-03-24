# Script para testar os endpoints de busca implementados
# Execute este script após iniciar o backend

Write-Host "=== TESTE DOS ENDPOINTS DE BUSCA - CONTAS A RECEBER ===" -ForegroundColor Green
Write-Host ""

# URL base do backend
$baseUrl = "http://localhost:8080"

# Headers para autenticação (ajuste conforme necessário)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN_HERE"  # Substitua pelo token real
}

Write-Host "1. Testando busca de números de fatura..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable/search/invoice-number?term=FAT" -Method GET -Headers $headers
    Write-Host "✅ Números de fatura encontrados: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Números: $($response -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar números de fatura: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testando busca de números de medição..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable/search/measurement-number?term=MED" -Method GET -Headers $headers
    Write-Host "✅ Números de medição encontrados: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Números: $($response -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar números de medição: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Testando busca de categorias..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable/search/categories?term=SERVICE" -Method GET -Headers $headers
    Write-Host "✅ Categorias encontradas: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Categorias: $($response -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar categorias: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Testando busca de formas de pagamento..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable/search/payment-methods?term=PIX" -Method GET -Headers $headers
    Write-Host "✅ Formas de pagamento encontradas: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Formas: $($response -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar formas de pagamento: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Testando busca com termo vazio..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable/search/invoice-number?term=" -Method GET -Headers $headers
    Write-Host "✅ Busca com termo vazio retornou: $($response.Count) resultados" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao buscar com termo vazio: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RESUMO DO TESTE ===" -ForegroundColor Green
Write-Host "Se todos os testes passaram, os endpoints de busca estão funcionando!" -ForegroundColor Green
Write-Host ""
Write-Host "Funcionalidades implementadas:" -ForegroundColor Yellow
Write-Host "  ✅ Busca de números de fatura em tempo real" -ForegroundColor Green
Write-Host "  ✅ Busca de números de medição em tempo real" -ForegroundColor Green
Write-Host "  ✅ Busca de categorias em tempo real" -ForegroundColor Green
Write-Host "  ✅ Busca de formas de pagamento em tempo real" -ForegroundColor Green
Write-Host ""
Write-Host "Como testar no frontend:" -ForegroundColor Yellow
Write-Host "  1. Abra o modal 'Nova Conta a Receber'" -ForegroundColor Yellow
Write-Host "  2. Digite nos campos indicados na imagem" -ForegroundColor Yellow
Write-Host "  3. Veja as sugestões aparecerem automaticamente" -ForegroundColor Yellow
Write-Host "  4. Clique em uma sugestão para selecionar" -ForegroundColor Yellow
