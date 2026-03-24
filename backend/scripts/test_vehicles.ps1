# Script para testar a API de veículos
Write-Host "Testando API de veículos..." -ForegroundColor Green

# Dados de login
$loginData = @{
    username = "superadmin"
    password = "Password123!"
} | ConvertTo-Json

# Fazer login
Write-Host "Fazendo login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"

# Extrair token
$token = $loginResponse.token
Write-Host "Token obtido com sucesso!" -ForegroundColor Green

# Testar API de veículos
Write-Host "Testando GET /api/vehicles..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $vehiclesResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method GET -Headers $headers
    
    Write-Host "Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    $vehiclesResponse | ForEach-Object {
        Write-Host "  - $($_.plate) - $($_.brand) $($_.model) ($($_.year))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Erro ao buscar veículos: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "Teste concluído!" -ForegroundColor Green 