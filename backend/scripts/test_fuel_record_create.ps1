# Script de teste para registro de abastecimento
# Testa a criação de um registro de abastecimento no backend

# Configurações
$apiUrl = "http://localhost:8080"
$loginUrl = "$apiUrl/api/auth/login"

# Credenciais de teste
$loginData = @{
    email = "admin@teste.com"
    password = "123456"
} | ConvertTo-Json

Write-Host "🔐 Fazendo login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Login realizado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Buscar veículos disponíveis
Write-Host "`n🚗 Buscando veículos disponíveis..." -ForegroundColor Yellow
try {
    $vehiclesResponse = Invoke-RestMethod -Uri "$apiUrl/api/vehicles" -Method GET -Headers $headers
    Write-Host "✅ Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    
    if ($vehiclesResponse.Count -eq 0) {
        Write-Host "❌ Nenhum veículo encontrado. Criando um veículo de teste..." -ForegroundColor Red
        
        # Criar um veículo de teste
        $newVehicle = @{
            plate = "TEST-123"
            model = "Teste"
            brand = "Teste"
            year = 2024
            color = "Branco"
            status = "ACTIVE"
            fuelType = "FLEX"
            capacity = 5
            currentMileage = 10000
        } | ConvertTo-Json
        
        $createVehicleResponse = Invoke-RestMethod -Uri "$apiUrl/api/vehicles" -Method POST -Body $newVehicle -Headers $headers
        $vehicleId = $createVehicleResponse.id
        Write-Host "✅ Veículo de teste criado com ID: $vehicleId" -ForegroundColor Green
    } else {
        $vehicleId = $vehiclesResponse[0].id
        Write-Host "✅ Usando veículo: $($vehiclesResponse[0].plate)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro ao buscar veículos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Buscar registros de abastecimento existentes
Write-Host "`n⛽ Buscando registros de abastecimento existentes..." -ForegroundColor Yellow
try {
    $fuelRecordsResponse = Invoke-RestMethod -Uri "$apiUrl/api/fuel-records" -Method GET -Headers $headers
    Write-Host "✅ Registros de abastecimento encontrados: $($fuelRecordsResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao buscar registros de abastecimento: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Criar um novo registro de abastecimento
Write-Host "`n⛽ Criando novo registro de abastecimento..." -ForegroundColor Yellow
try {
    $newFuelRecord = @{
        vehicle = @{
            id = $vehicleId
        }
        date = (Get-Date).ToString("yyyy-MM-dd")
        fuelType = "GASOLINE"
        quantity = 50.0
        cost = 250.00
        mileage = 10000
        station = "Posto Teste"
        notes = "Teste de registro de abastecimento"
    } | ConvertTo-Json -Depth 3
    
    Write-Host "📤 Dados sendo enviados:" -ForegroundColor Gray
    Write-Host $newFuelRecord -ForegroundColor Gray
    
    $createFuelRecordResponse = Invoke-RestMethod -Uri "$apiUrl/api/fuel-records" -Method POST -Body $newFuelRecord -Headers $headers
    
    Write-Host "✅ Registro de abastecimento criado com sucesso!" -ForegroundColor Green
    Write-Host "  ID: $($createFuelRecordResponse.id)" -ForegroundColor Gray
    Write-Host "  Veículo: $($createFuelRecordResponse.vehiclePlate)" -ForegroundColor Gray
    Write-Host "  Data: $($createFuelRecordResponse.date)" -ForegroundColor Gray
    Write-Host "  Litros: $($createFuelRecordResponse.quantity)" -ForegroundColor Gray
    Write-Host "  Valor: R$ $($createFuelRecordResponse.cost)" -ForegroundColor Gray
    Write-Host "  Posto: $($createFuelRecordResponse.station)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao criar registro de abastecimento: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "📄 Resposta de erro do servidor:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
    }
    exit 1
}

# Verificar se o registro foi criado na lista
Write-Host "`n🔍 Verificando se o registro foi adicionado à lista..." -ForegroundColor Yellow
try {
    $updatedFuelRecordsResponse = Invoke-RestMethod -Uri "$apiUrl/api/fuel-records" -Method GET -Headers $headers
    Write-Host "✅ Total de registros após criação: $($updatedFuelRecordsResponse.Count)" -ForegroundColor Green
    
    $newRecordInList = $updatedFuelRecordsResponse | Where-Object { $_.vehiclePlate -eq "TEST-123" -and $_.station -eq "Posto Teste" }
    if ($newRecordInList) {
        Write-Host "✅ Registro encontrado na lista!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Registro não encontrado na lista (pode ser um problema de cache)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao verificar lista: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar busca por veículo específico
Write-Host "`n🔍 Testando busca por veículo específico..." -ForegroundColor Yellow
try {
    $vehicleFuelRecordsResponse = Invoke-RestMethod -Uri "$apiUrl/api/fuel-records/vehicle/$vehicleId" -Method GET -Headers $headers
    Write-Host "✅ Registros do veículo $vehicleId: $($vehicleFuelRecordsResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao buscar registros do veículo: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Teste de registro de abastecimento concluído!" -ForegroundColor Green 