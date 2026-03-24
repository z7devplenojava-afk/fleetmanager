# Teste completo da API de veículos
Write-Host "Testando API de veículos completa..." -ForegroundColor Green

# Fazer login
Write-Host "Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    username = "superadmin"
    password = "Password123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers com token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Teste 1: Listar veículos (deve retornar lista vazia)
Write-Host "`n1. Testando GET /api/vehicles (lista vazia)..." -ForegroundColor Yellow
try {
    $vehicles = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method GET -Headers $headers
    Write-Host "Veículos encontrados: $($vehicles.Count)" -ForegroundColor Green
    $vehicles | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Erro ao listar veículos: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Criar um veículo
Write-Host "`n2. Testando POST /api/vehicles (criar veículo)..." -ForegroundColor Yellow
$vehicleData = @{
    plate = "ABC1234"
    model = "Civic"
    brand = "Honda"
    year = 2020
    color = "Prata"
    status = "ACTIVE"
    fuelType = "FLEX"
    capacity = 5
    currentMileage = 50000
    lastMaintenanceDate = "2024-01-15"
    nextMaintenanceDate = "2024-07-15"
    insuranceExpiryDate = "2024-12-31"
    documentationExpiryDate = "2024-12-31"
} | ConvertTo-Json

try {
    $newVehicle = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method POST -Body $vehicleData -Headers $headers
    Write-Host "Veículo criado com sucesso!" -ForegroundColor Green
    Write-Host "ID: $($newVehicle.id)" -ForegroundColor Cyan
    Write-Host "Placa: $($newVehicle.plate)" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao criar veículo: $($_.Exception.Message)" -ForegroundColor Red
    $newVehicle = $null
}

# Teste 3: Listar veículos novamente (deve ter 1 veículo)
Write-Host "`n3. Testando GET /api/vehicles (com veículo criado)..." -ForegroundColor Yellow
try {
    $vehicles = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method GET -Headers $headers
    Write-Host "Veículos encontrados: $($vehicles.Count)" -ForegroundColor Green
    $vehicles | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Erro ao listar veículos: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: Buscar veículo por ID
if ($newVehicle) {
    Write-Host "`n4. Testando GET /api/vehicles/$($newVehicle.id)..." -ForegroundColor Yellow
    try {
        $vehicle = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles/$($newVehicle.id)" -Method GET -Headers $headers
        Write-Host "Veículo encontrado!" -ForegroundColor Green
        Write-Host "Placa: $($vehicle.plate)" -ForegroundColor Cyan
        Write-Host "Modelo: $($vehicle.model)" -ForegroundColor Cyan
    } catch {
        Write-Host "Erro ao buscar veículo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 5: Atualizar veículo
if ($newVehicle) {
    Write-Host "`n5. Testando PUT /api/vehicles/$($newVehicle.id)..." -ForegroundColor Yellow
    $updateData = @{
        plate = "XYZ5678"
        model = "Civic"
        brand = "Honda"
        year = 2021
        color = "Preto"
        status = "ACTIVE"
        fuelType = "FLEX"
        capacity = 5
        currentMileage = 55000
    } | ConvertTo-Json

    try {
        $updatedVehicle = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles/$($newVehicle.id)" -Method PUT -Body $updateData -Headers $headers
        Write-Host "Veículo atualizado com sucesso!" -ForegroundColor Green
        Write-Host "Nova placa: $($updatedVehicle.plate)" -ForegroundColor Cyan
    } catch {
        Write-Host "Erro ao atualizar veículo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 6: Deletar veículo
if ($newVehicle) {
    Write-Host "`n6. Testando DELETE /api/vehicles/$($newVehicle.id)..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles/$($newVehicle.id)" -Method DELETE -Headers $headers
        Write-Host "Veículo deletado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao deletar veículo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 7: Listar veículos final (deve estar vazio novamente)
Write-Host "`n7. Testando GET /api/vehicles (após deletar)..." -ForegroundColor Yellow
try {
    $vehicles = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method GET -Headers $headers
    Write-Host "Veículos encontrados: $($vehicles.Count)" -ForegroundColor Green
} catch {
    Write-Host "Erro ao listar veículos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTeste completo finalizado!" -ForegroundColor Green 