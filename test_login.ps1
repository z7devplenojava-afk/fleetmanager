# Script para testar login e API de veículos
Write-Host "Testando login e API de veículos..." -ForegroundColor Green

# Dados de login
$loginData = @{
    username = "jose.ramos"
    password = "Password123!"
} | ConvertTo-Json

# Fazer login
Write-Host "Fazendo login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login bem-sucedido!" -ForegroundColor Green
    
    # Extrair token
    $token = $loginResponse.token
    Write-Host "Token obtido: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    # Testar API de veículos
    Write-Host "Testando GET /api/frota/vehicles..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $vehiclesResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/frota/vehicles" -Method GET -Headers $headers
    
    Write-Host "Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    $vehiclesResponse | ForEach-Object {
        Write-Host "  - $($_.plate) - $($_.brand) $($_.model) ($($_.year))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    }
}

Write-Host "Teste concluído!" -ForegroundColor Green
