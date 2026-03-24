# Script para testar multas com autenticação
$baseUrl = "http://localhost:8081"

Write-Host "🔐 Fazendo login..." -ForegroundColor Yellow

# Login
$loginData = @{
    username = "jose.ramos"
    password = "123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"

if ($loginResponse.token) {
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    $token = $loginResponse.token
    
    # Headers com token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "📋 Buscando multas..." -ForegroundColor Yellow
    $finesResponse = Invoke-RestMethod -Uri "$baseUrl/api/fines" -Method GET -Headers $headers
    
    Write-Host "📊 Multas encontradas: $($finesResponse.Count)" -ForegroundColor Cyan
    foreach ($fine in $finesResponse) {
        Write-Host "  - ID: $($fine.id)" -ForegroundColor White
        Write-Host "    Veículo: $($fine.vehiclePlate)" -ForegroundColor White
        Write-Host "    Motorista: $($fine.driverName)" -ForegroundColor White
        Write-Host "    Status: $($fine.status)" -ForegroundColor White
        Write-Host "    Valor: R$ $($fine.amount)" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "📄 Testando geração de relatório PDF..." -ForegroundColor Yellow
    try {
        $pdfResponse = Invoke-WebRequest -Uri "$baseUrl/api/fines/reports/pdf" -Method GET -Headers $headers -OutFile "test_fine_report_auth.pdf"
        Write-Host "✅ Relatório PDF gerado com sucesso!" -ForegroundColor Green
        Write-Host "📁 Arquivo salvo como: test_fine_report_auth.pdf" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Erro ao gerar relatório PDF: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Falha no login" -ForegroundColor Red
}
