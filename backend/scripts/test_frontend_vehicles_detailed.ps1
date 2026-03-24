# Script detalhado para testar a API de veículos
Write-Host "=== TESTE DETALHADO DA API DE VEÍCULOS ===" -ForegroundColor Green

# Dados de login
$loginData = @{
    username = "superadmin"
    password = "Password123!"
} | ConvertTo-Json

# Fazer login
Write-Host "1. Fazendo login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✓ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "   ✗ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Testar API de veículos
Write-Host "`n2. Testando GET /api/vehicles..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $vehiclesResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method GET -Headers $headers
    
    Write-Host "   ✓ Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    $vehiclesResponse | ForEach-Object {
        Write-Host "     - $($_.plate) - $($_.brand) $($_.model) ($($_.year)) - $($_.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ✗ Erro ao buscar veículos: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "   Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    }
}

# Testar endpoint de teste
Write-Host "`n3. Testando endpoint de teste..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/test/health" -Method GET
    Write-Host "   ✓ Endpoint de teste: $testResponse" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erro no endpoint de teste: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar CORS
Write-Host "`n4. Testando CORS..." -ForegroundColor Yellow
try {
    $corsHeaders = @{
        "Origin" = "http://localhost:5173"
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "Authorization,Content-Type"
    }
    
    $corsResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/vehicles" -Method OPTIONS -Headers $corsHeaders
    Write-Host "   ✓ CORS funcionando - Status: $($corsResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Access-Control-Allow-Origin: $($corsResponse.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Cyan
} catch {
    Write-Host "   ✗ Erro no CORS: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Green 