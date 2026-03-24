# Script simples para testar endpoint de abastecimento
# Identifica o erro 400

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

# Buscar um veículo para usar no teste
Write-Host "`n🚗 Buscando veículos..." -ForegroundColor Yellow
try {
    $vehiclesResponse = Invoke-RestMethod -Uri "$apiUrl/api/vehicles" -Method GET -Headers $headers
    Write-Host "✅ Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    
    if ($vehiclesResponse.Count -eq 0) {
        Write-Host "❌ Nenhum veículo encontrado. Criando um..." -ForegroundColor Red
        
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
        Write-Host "✅ Veículo criado: $vehicleId" -ForegroundColor Green
    } else {
        $vehicleId = $vehiclesResponse[0].id
        Write-Host "✅ Usando veículo: $($vehiclesResponse[0].plate) - ID: $vehicleId" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro ao buscar veículos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 1: JSON com todos os campos obrigatórios
Write-Host "`n🧪 Teste 1: JSON completo..." -ForegroundColor Yellow
try {
    $testData1 = @{
        vehicleId = $vehicleId
        date = (Get-Date).ToString("yyyy-MM-dd")
        fuelType = "GASOLINE"
        quantity = 50.0
        cost = 250.00
        mileage = 10000
        station = "Posto Teste"
        notes = "Teste completo"
    } | ConvertTo-Json
    
    Write-Host "📤 Enviando dados:" -ForegroundColor Gray
    Write-Host $testData1 -ForegroundColor Gray
    
    $response1 = Invoke-RestMethod -Uri "$apiUrl/api/fuel-records" -Method POST -Body $testData1 -Headers $headers
    Write-Host "✅ Teste 1: Sucesso! ID: $($response1.id)" -ForegroundColor Green
    
    # Limpar o registro criado
    Invoke-RestMethod -Uri "$apiUrl/api/fuel-records/$($response1.id)" -Method DELETE -Headers $headers | Out-Null
    Write-Host "🗑️  Registro de teste removido" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Teste 1 falhou: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "📄 Resposta de erro:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
    }
}

# Teste 2: JSON mínimo (sem notes)
Write-Host "`n🧪 Teste 2: JSON mínimo..." -ForegroundColor Yellow
try {
    $testData2 = @{
        vehicleId = $vehicleId
        date = (Get-Date).ToString("yyyy-MM-dd")
        fuelType = "GASOLINE"
        quantity = 50.0
        cost = 250.00
        mileage = 10000
        station = "Posto Teste"
    } | ConvertTo-Json
    
    Write-Host "📤 Enviando dados:" -ForegroundColor Gray
    Write-Host $testData2 -ForegroundColor Gray
    
    $response2 = Invoke-RestMethod -Uri "$apiUrl/api/fuel-records" -Method POST -Body $testData2 -Headers $headers
    Write-Host "✅ Teste 2: Sucesso! ID: $($response2.id)" -ForegroundColor Green
    
    # Limpar o registro criado
    Invoke-RestMethod -Uri "$apiUrl/api/fuel-records/$($response2.id)" -Method DELETE -Headers $headers | Out-Null
    Write-Host "🗑️  Registro de teste removido" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Teste 2 falhou: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "📄 Resposta de erro:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
    }
}

Write-Host "`n✅ Testes concluídos!" -ForegroundColor Green 