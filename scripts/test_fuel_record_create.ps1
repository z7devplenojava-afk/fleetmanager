# Teste de Cadastro de Registros de Abastecimento
Write-Host "=== TESTE DE CADASTRO DE ABASTECIMENTOS ===" -ForegroundColor Yellow

# Configurações
$baseUrl = "http://localhost:8080"
$apiUrl = "http://localhost:8080/api"

# 1. Fazer login para obter token
Write-Host "`n1. Fazendo login..." -ForegroundColor Cyan
$loginData = @{
    username = "superadmin"
    password = "Password123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login realizado com sucesso" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Verificar veículos disponíveis
Write-Host "`n2. Verificando veículos disponíveis..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $vehiclesResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles" -Method GET -Headers $headers
    Write-Host "✅ Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    
    $activeVehicles = $vehiclesResponse | Where-Object { $_.status -eq "ACTIVE" }
    Write-Host "✅ Veículos ativos: $($activeVehicles.Count)" -ForegroundColor Green
    
    if ($activeVehicles.Count -eq 0) {
        Write-Host "❌ Nenhum veículo ativo encontrado. Criando um veículo de teste..." -ForegroundColor Yellow
        
        # Criar um veículo de teste
        $testVehicle = @{
            plate = "TEST-123"
            brand = "Toyota"
            model = "Corolla"
            year = 2022
            color = "Prata"
            fuelType = "FLEX"
            currentMileage = 15000
            status = "ACTIVE"
            capacity = 5
        } | ConvertTo-Json
        
        $createVehicleResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles" -Method POST -Body $testVehicle -Headers $headers
        $vehicleId = $createVehicleResponse.id
        Write-Host "✅ Veículo de teste criado: $($createVehicleResponse.plate)" -ForegroundColor Green
    } else {
        $vehicleId = $activeVehicles[0].id
        Write-Host "✅ Usando veículo: $($activeVehicles[0].plate)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro ao buscar veículos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Verificar registros de abastecimento existentes
Write-Host "`n3. Verificando registros de abastecimento existentes..." -ForegroundColor Cyan
try {
    $fuelRecordsResponse = Invoke-RestMethod -Uri "$apiUrl/fuel-records" -Method GET -Headers $headers
    Write-Host "✅ Registros de abastecimento encontrados: $($fuelRecordsResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao buscar registros de abastecimento: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar criação de registro de abastecimento
Write-Host "`n4. Testando criação de registro de abastecimento..." -ForegroundColor Cyan
$newFuelRecord = @{
    vehicleId = $vehicleId
    vehiclePlate = "TEST-123"
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    fuelType = "GASOLINE"
    quantity = 45.5
    cost = 250.75
    mileage = 15200
    station = "Posto Teste"
    notes = "Teste de abastecimento via API"
} | ConvertTo-Json

try {
    $createFuelRecordResponse = Invoke-RestMethod -Uri "$apiUrl/fuel-records" -Method POST -Body $newFuelRecord -Headers $headers
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
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}

# 5. Verificar se o registro foi adicionado à lista
Write-Host "`n5. Verificando se o registro foi adicionado..." -ForegroundColor Cyan
try {
    $updatedFuelRecordsResponse = Invoke-RestMethod -Uri "$apiUrl/fuel-records" -Method GET -Headers $headers
    Write-Host "✅ Total de registros após criação: $($updatedFuelRecordsResponse.Count)" -ForegroundColor Green
    
    $newRecordInList = $updatedFuelRecordsResponse | Where-Object { $_.vehiclePlate -eq "TEST-123" -and $_.station -eq "Posto Teste" }
    if ($newRecordInList) {
        Write-Host "✅ Registro encontrado na lista!" -ForegroundColor Green
    } else {
        Write-Host "❌ Registro não encontrado na lista" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar lista atualizada: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Testar busca por veículo específico
Write-Host "`n6. Testando busca por veículo específico..." -ForegroundColor Cyan
try {
    $vehicleFuelRecordsResponse = Invoke-RestMethod -Uri "$apiUrl/fuel-records?vehicleId=$vehicleId" -Method GET -Headers $headers
    Write-Host "✅ Registros do veículo $vehicleId: $($vehicleFuelRecordsResponse.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao buscar registros do veículo: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Yellow
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique se o frontend está rodando em http://localhost:3000" -ForegroundColor White
Write-Host "2. Acesse a página de Frota" -ForegroundColor White
Write-Host "3. Vá para a aba 'Abastecimentos'" -ForegroundColor White
Write-Host "4. Tente cadastrar um abastecimento via interface" -ForegroundColor White
Write-Host "5. Verifique se a lista é atualizada automaticamente" -ForegroundColor White 