# Teste de Cadastro de Veículos via Frontend
Write-Host "=== TESTE DE CADASTRO DE VEÍCULOS VIA FRONTEND ===" -ForegroundColor Yellow

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

# 2. Verificar veículos existentes
Write-Host "`n2. Verificando veículos existentes..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $vehiclesResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles" -Method GET -Headers $headers
    Write-Host "✅ Veículos encontrados: $($vehiclesResponse.Count)" -ForegroundColor Green
    foreach ($vehicle in $vehiclesResponse) {
        Write-Host "  - $($vehicle.plate) ($($vehicle.brand) $($vehicle.model))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erro ao buscar veículos: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar criação de veículo
Write-Host "`n3. Testando criação de veículo..." -ForegroundColor Cyan
$newVehicle = @{
    plate = "ABC-1234"
    brand = "Toyota"
    model = "Corolla"
    year = 2022
    color = "Prata"
    fuelType = "FLEX"
    currentMileage = 15000
    status = "ACTIVE"
    capacity = 5
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles" -Method POST -Body $newVehicle -Headers $headers
    Write-Host "✅ Veículo criado com sucesso!" -ForegroundColor Green
    Write-Host "  ID: $($createResponse.id)" -ForegroundColor Gray
    Write-Host "  Placa: $($createResponse.plate)" -ForegroundColor Gray
    Write-Host "  Marca: $($createResponse.brand)" -ForegroundColor Gray
    Write-Host "  Modelo: $($createResponse.model)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao criar veículo: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}

# 4. Verificar se o veículo foi adicionado à lista
Write-Host "`n4. Verificando se o veículo foi adicionado..." -ForegroundColor Cyan
try {
    $updatedVehiclesResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles" -Method GET -Headers $headers
    Write-Host "✅ Total de veículos após criação: $($updatedVehiclesResponse.Count)" -ForegroundColor Green
    
    $newVehicleInList = $updatedVehiclesResponse | Where-Object { $_.plate -eq "ABC-1234" }
    if ($newVehicleInList) {
        Write-Host "✅ Veículo encontrado na lista!" -ForegroundColor Green
    } else {
        Write-Host "❌ Veículo não encontrado na lista" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar lista atualizada: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Testar criação de veículo duplicado
Write-Host "`n5. Testando criação de veículo duplicado..." -ForegroundColor Cyan
try {
    $duplicateResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles" -Method POST -Body $newVehicle -Headers $headers
    Write-Host "❌ Erro: Veículo duplicado foi criado (não deveria)" -ForegroundColor Red
} catch {
    Write-Host "✅ Erro esperado para veículo duplicado" -ForegroundColor Green
    Write-Host "  Mensagem: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Yellow
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique se o frontend está rodando em http://localhost:3000" -ForegroundColor White
Write-Host "2. Acesse a página de Frota" -ForegroundColor White
Write-Host "3. Tente cadastrar um veículo via interface" -ForegroundColor White
Write-Host "4. Verifique se a lista é atualizada automaticamente" -ForegroundColor White 