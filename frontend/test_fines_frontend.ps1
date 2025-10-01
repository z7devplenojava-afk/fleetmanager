# Script para testar o frontend e verificar se as multas estão sendo carregadas
Write-Host "=== Teste do Frontend - Multas ===" -ForegroundColor Green

# Verificar se o frontend está rodando
Write-Host "1. Verificando se o frontend está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "Frontend está rodando!" -ForegroundColor Green
} catch {
    Write-Host "Frontend não está rodando. Iniciando..." -ForegroundColor Yellow
    
    # Tentar iniciar o frontend
    try {
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "D:\dev\secure-guard\frontend" -WindowStyle Minimized
        Write-Host "Frontend iniciado. Aguardando 30 segundos para carregar..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    } catch {
        Write-Host "Erro ao iniciar frontend: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Verificar se o backend está rodando
Write-Host "`n2. Verificando se o backend está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/health" -Method GET -TimeoutSec 5
    Write-Host "Backend está rodando!" -ForegroundColor Green
} catch {
    Write-Host "Backend não está rodando. Iniciando..." -ForegroundColor Yellow
    
    # Tentar iniciar o backend
    try {
        Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -WorkingDirectory "D:\dev\secure-guard\backend" -WindowStyle Minimized
        Write-Host "Backend iniciado. Aguardando 60 segundos para carregar..." -ForegroundColor Yellow
        Start-Sleep -Seconds 60
    } catch {
        Write-Host "Erro ao iniciar backend: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Testar a API de multas diretamente
Write-Host "`n3. Testando API de multas..." -ForegroundColor Yellow
try {
    # Login
    $loginData = @{
        username = "superadmin"
        password = "Password123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    
    # Buscar multas
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $fines = Invoke-RestMethod -Uri "http://localhost:8081/api/fines" -Method GET -Headers $headers
    Write-Host "API retornou $($fines.Count) multas" -ForegroundColor Green
    
    if ($fines.Count -gt 0) {
        Write-Host "Primeira multa:" -ForegroundColor Cyan
        Write-Host "  ID: $($fines[0].id)"
        Write-Host "  Veículo: $($fines[0].vehiclePlate)"
        Write-Host "  Descrição: $($fines[0].description)"
        Write-Host "  Valor: R$ $($fines[0].amount)"
        Write-Host "  Status: $($fines[0].status)"
    }
    
} catch {
    Write-Host "Erro ao testar API: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n4. Instruções para testar no navegador:" -ForegroundColor Yellow
Write-Host "1. Abra http://localhost:3000 no navegador" -ForegroundColor White
Write-Host "2. Faça login com superadmin / Password123!" -ForegroundColor White
Write-Host "3. Vá para a página 'Frota'" -ForegroundColor White
Write-Host "4. Clique na aba 'Multas'" -ForegroundColor White
Write-Host "5. Verifique se as multas aparecem na lista" -ForegroundColor White
Write-Host "6. Abra o DevTools (F12) e verifique o console para erros" -ForegroundColor White

Write-Host "`n=== Teste concluído ===" -ForegroundColor Green 