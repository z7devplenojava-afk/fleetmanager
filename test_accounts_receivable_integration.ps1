# Script para testar a integração do frontend com o backend para Contas a Receber
# Execute este script após iniciar o backend

Write-Host "=== TESTE DE INTEGRAÇÃO - CONTAS A RECEBER ===" -ForegroundColor Green
Write-Host ""

# URL base do backend
$baseUrl = "http://localhost:8080"

# Headers para autenticação (ajuste conforme necessário)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN_HERE"  # Substitua pelo token real
}

Write-Host "1. Testando endpoint de clientes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/clients/all" -Method GET -Headers $headers
    Write-Host "✅ Clientes encontrados: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Primeiro cliente: $($response[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar clientes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testando endpoint de contas a receber..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable/all" -Method GET -Headers $headers
    Write-Host "✅ Contas a receber encontradas: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Primeira conta: $($response[0].invoiceNumber) - $($response[0].description)" -ForegroundColor Cyan
        Write-Host "   Valor: R$ $($response[0].amount)" -ForegroundColor Cyan
        Write-Host "   Status: $($response[0].status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar contas a receber: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Testando endpoint de busca de números de fatura..." -ForegroundColor Yellow
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
Write-Host "4. Testando endpoint de contas vencidas..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable/overdue" -Method GET -Headers $headers
    Write-Host "✅ Contas vencidas encontradas: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Primeira conta vencida: $($response[0].invoiceNumber)" -ForegroundColor Cyan
        Write-Host "   Dias de atraso: $($response[0].overdueDays)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao buscar contas vencidas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Testando criação de nova conta a receber..." -ForegroundColor Yellow
try {
    $newAccount = @{
        clientId = "11111111-1111-1111-1111-111111111111"
        invoiceNumber = "FAT-TEST-001"
        measurementNumber = "MED-TEST-001"
        description = "Teste de integração - Conta a Receber"
        amount = 1000.00
        issueDate = "2024-01-15"
        dueDate = "2024-02-15"
        category = "SERVICE"
        paymentMethod = "PIX"
        notes = "Conta criada via teste de integração"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts-receivable" -Method POST -Headers $headers -Body $newAccount
    Write-Host "✅ Conta a receber criada com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "   Número da Fatura: $($response.invoiceNumber)" -ForegroundColor Cyan
    Write-Host "   Descrição: $($response.description)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro ao criar conta a receber: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RESUMO DO TESTE ===" -ForegroundColor Green
Write-Host "Se todos os testes passaram, a integração está funcionando corretamente!" -ForegroundColor Green
Write-Host "Caso contrário, verifique:" -ForegroundColor Yellow
Write-Host "  - Se o backend está rodando na porta 8080" -ForegroundColor Yellow
Write-Host "  - Se o token de autenticação está correto" -ForegroundColor Yellow
Write-Host "  - Se os dados de teste foram inseridos no banco" -ForegroundColor Yellow
Write-Host "  - Se as permissões de segurança estão configuradas" -ForegroundColor Yellow
