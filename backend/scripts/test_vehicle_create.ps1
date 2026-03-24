# Script para testar o endpoint de cadastro de veículos
Write-Host "=== TESTE DE CADASTRO DE VEÍCULOS ===" -ForegroundColor Green

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
} catch {
    Write-Host "   ✗ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Dados do veículo para cadastro
$vehicleData = @{
    plate = "XYZ-1234"
    model = "Civic"
    brand = "Honda"
    year = 2023
    color = "Prata"
    status = "ACTIVE"
    fuelType = "FLEX"
    capacity = 5
    currentMileage = 15000
    lastMaintenanceDate = "2024-01-15"
    nextMaintenanceDate = "2024-07-15"
    insuranceExpiryDate = "2024-12-31"
    documentationExpiryDate = "2024-12-31"
} | ConvertTo-Json

# Testar cadastro de veículo
Write-Host "`n2. Testando POST /api/vehicles..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $createResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method POST -Body $vehicleData -Headers $headers
    
    Write-Host "   ✓ Veículo cadastrado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($createResponse.id)" -ForegroundColor Cyan
    Write-Host "   Placa: $($createResponse.plate)" -ForegroundColor Cyan
    Write-Host "   Modelo: $($createResponse.brand) $($createResponse.model)" -ForegroundColor Cyan
    Write-Host "   Ano: $($createResponse.year)" -ForegroundColor Cyan
    Write-Host "   Status: $($createResponse.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   ✗ Erro ao cadastrar veículo: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "   Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    }
}

# Testar cadastro de veículo com placa duplicada
Write-Host "`n3. Testando cadastro com placa duplicada..." -ForegroundColor Yellow
try {
    $duplicateResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method POST -Body $vehicleData -Headers $headers
    
    Write-Host "   ✓ Veículo duplicado cadastrado (não deveria acontecer)" -ForegroundColor Green
} catch {
    Write-Host "   ✓ Erro esperado para placa duplicada: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# Listar veículos para confirmar
Write-Host "`n4. Listando veículos..." -ForegroundColor Yellow
try {
    $vehiclesResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method GET -Headers $headers
    
    Write-Host "   ✓ Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    $vehiclesResponse | ForEach-Object {
        Write-Host "     - $($_.plate) - $($_.brand) $($_.model) ($($_.year)) - $($_.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ✗ Erro ao listar veículos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Green 