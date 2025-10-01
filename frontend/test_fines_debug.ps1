# Script para debug detalhado da API de multas
Write-Host "=== Debug Detalhado - API de Multas ===" -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:8081"
$loginUrl = "$baseUrl/api/auth/login"
$finesUrl = "$baseUrl/api/fines"

Write-Host "1. Testando login..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "superadmin"
        password = "Password123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers para as requisições
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n2. Testando API de multas..." -ForegroundColor Yellow
try {
    Write-Host "Fazendo requisição para: $finesUrl" -ForegroundColor Cyan
    $fines = Invoke-RestMethod -Uri $finesUrl -Method GET -Headers $headers
    Write-Host "API retornou $($fines.Count) multas" -ForegroundColor Green
    
    if ($fines.Count -gt 0) {
        Write-Host "`nDetalhes da primeira multa:" -ForegroundColor Cyan
        $fine = $fines[0]
        Write-Host "  ID: $($fine.id)"
        Write-Host "  Vehicle ID: $($fine.vehicleId)"
        Write-Host "  Vehicle Plate: $($fine.vehiclePlate)"
        Write-Host "  Date: $($fine.date)"
        Write-Host "  Description: $($fine.description)"
        Write-Host "  Amount: $($fine.amount)"
        Write-Host "  Location: $($fine.location)"
        Write-Host "  Status: $($fine.status)"
        Write-Host "  Due Date: $($fine.dueDate)"
        Write-Host "  Payment Date: $($fine.paymentDate)"
        Write-Host "  Created At: $($fine.createdAt)"
    }
    
} catch {
    Write-Host "Erro ao buscar multas: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n3. Testando CORS..." -ForegroundColor Yellow
try {
    $corsHeaders = @{
        "Origin" = "http://localhost:3000"
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $finesCors = Invoke-RestMethod -Uri $finesUrl -Method GET -Headers $corsHeaders
    Write-Host "CORS testado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro no teste CORS: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Verificando se o frontend consegue acessar..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "Frontend está acessível!" -ForegroundColor Green
} catch {
    Write-Host "Frontend não está acessível: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Instruções para testar ===" -ForegroundColor Yellow
Write-Host "1. Abra http://localhost:3000 no navegador" -ForegroundColor White
Write-Host "2. Faça login com superadmin / Password123!" -ForegroundColor White
Write-Host "3. Vá para a página 'Frota'" -ForegroundColor White
Write-Host "4. Clique na aba 'Multas'" -ForegroundColor White
Write-Host "5. Abra o DevTools (F12) e vá para a aba Console" -ForegroundColor White
Write-Host "6. Verifique os logs de debug que adicionamos" -ForegroundColor White
Write-Host "7. Verifique se há erros de rede na aba Network" -ForegroundColor White

Write-Host "`n=== Debug concluído ===" -ForegroundColor Green 