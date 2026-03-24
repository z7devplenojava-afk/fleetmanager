# Script para testar o endpoint de ocorrências
Write-Host "Testando endpoint de ocorrências..." -ForegroundColor Green

# Primeiro, fazer login para obter o token
$loginData = @{
    email = "jose.ramos@promover.com"
    password = "Password123!"
} | ConvertTo-Json

Write-Host "Fazendo login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"

if ($loginResponse.token) {
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
    
    # Configurar headers com o token
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.token)"
        "Content-Type" = "application/json"
    }
    
    # Testar o endpoint de ocorrências
    Write-Host "Testando GET /api/occurrences..." -ForegroundColor Yellow
    try {
        $occurrencesResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/occurrences" -Method GET -Headers $headers
        Write-Host "✅ Endpoint de ocorrências funcionando!" -ForegroundColor Green
        Write-Host "Número de ocorrências: $($occurrencesResponse.Count)" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Erro no endpoint de ocorrências:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
else {
    Write-Host "❌ Falha no login" -ForegroundColor Red
} 