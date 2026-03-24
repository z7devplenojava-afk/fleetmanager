# Teste de Edição de Veículos
Write-Host "=== TESTE DE EDIÇÃO DE VEÍCULOS ===" -ForegroundColor Yellow

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
    
    if ($vehiclesResponse.Count -eq 0) {
        Write-Host "❌ Nenhum veículo encontrado. Criando um veículo de teste..." -ForegroundColor Yellow
        
        # Criar um veículo de teste
        $testVehicle = @{
            plate = "EDIT-123"
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
        $vehicleId = $vehiclesResponse[0].id
        Write-Host "✅ Usando veículo existente: $($vehiclesResponse[0].plate)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro ao buscar veículos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Buscar dados do veículo antes da edição
Write-Host "`n3. Buscando dados do veículo antes da edição..." -ForegroundColor Cyan
try {
    $vehicleBeforeEdit = Invoke-RestMethod -Uri "$apiUrl/vehicles/$vehicleId" -Method GET -Headers $headers
    Write-Host "✅ Dados do veículo antes da edição:" -ForegroundColor Green
    Write-Host "  Placa: $($vehicleBeforeEdit.plate)" -ForegroundColor Gray
    Write-Host "  Marca: $($vehicleBeforeEdit.brand)" -ForegroundColor Gray
    Write-Host "  Modelo: $($vehicleBeforeEdit.model)" -ForegroundColor Gray
    Write-Host "  Cor: $($vehicleBeforeEdit.color)" -ForegroundColor Gray
    Write-Host "  Quilometragem: $($vehicleBeforeEdit.currentMileage)" -ForegroundColor Gray
    Write-Host "  Status: $($vehicleBeforeEdit.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao buscar dados do veículo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Testar edição do veículo
Write-Host "`n4. Testando edição do veículo..." -ForegroundColor Cyan
$updatedVehicle = @{
    plate = "EDIT-456"
    brand = "Honda"
    model = "Civic"
    year = 2023
    color = "Preto"
    fuelType = "FLEX"
    currentMileage = 18000
    status = "ACTIVE"
    capacity = 5
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles/$vehicleId" -Method PUT -Body $updatedVehicle -Headers $headers
    Write-Host "✅ Veículo editado com sucesso!" -ForegroundColor Green
    Write-Host "  Nova placa: $($updateResponse.plate)" -ForegroundColor Gray
    Write-Host "  Nova marca: $($updateResponse.brand)" -ForegroundColor Gray
    Write-Host "  Novo modelo: $($updateResponse.model)" -ForegroundColor Gray
    Write-Host "  Nova cor: $($updateResponse.color)" -ForegroundColor Gray
    Write-Host "  Nova quilometragem: $($updateResponse.currentMileage)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao editar veículo: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}

# 5. Verificar se a edição foi aplicada
Write-Host "`n5. Verificando se a edição foi aplicada..." -ForegroundColor Cyan
try {
    $vehicleAfterEdit = Invoke-RestMethod -Uri "$apiUrl/vehicles/$vehicleId" -Method GET -Headers $headers
    Write-Host "✅ Dados do veículo após a edição:" -ForegroundColor Green
    Write-Host "  Placa: $($vehicleAfterEdit.plate)" -ForegroundColor Gray
    Write-Host "  Marca: $($vehicleAfterEdit.brand)" -ForegroundColor Gray
    Write-Host "  Modelo: $($vehicleAfterEdit.model)" -ForegroundColor Gray
    Write-Host "  Cor: $($vehicleAfterEdit.color)" -ForegroundColor Gray
    Write-Host "  Quilometragem: $($vehicleAfterEdit.currentMileage)" -ForegroundColor Gray
    Write-Host "  Status: $($vehicleAfterEdit.status)" -ForegroundColor Gray
    
    # Verificar se as mudanças foram aplicadas
    if ($vehicleAfterEdit.plate -eq "EDIT-456" -and $vehicleAfterEdit.brand -eq "Honda") {
        Write-Host "✅ Edição confirmada - dados atualizados corretamente!" -ForegroundColor Green
    } else {
        Write-Host "❌ Edição não foi aplicada corretamente" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar dados após edição: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Testar edição parcial (apenas alguns campos)
Write-Host "`n6. Testando edição parcial..." -ForegroundColor Cyan
$partialUpdate = @{
    color = "Azul"
    currentMileage = 20000
} | ConvertTo-Json

try {
    $partialUpdateResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles/$vehicleId" -Method PUT -Body $partialUpdate -Headers $headers
    Write-Host "✅ Edição parcial realizada com sucesso!" -ForegroundColor Green
    Write-Host "  Nova cor: $($partialUpdateResponse.color)" -ForegroundColor Gray
    Write-Host "  Nova quilometragem: $($partialUpdateResponse.currentMileage)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro na edição parcial: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Yellow
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique se o frontend está rodando em http://localhost:3000" -ForegroundColor White
Write-Host "2. Acesse a página de Frota" -ForegroundColor White
Write-Host "3. Clique no botão 'Editar' de um veículo na lista" -ForegroundColor White
Write-Host "4. Verifique se o modal abre com os dados do veículo" -ForegroundColor White
Write-Host "5. Faça alterações e salve" -ForegroundColor White
Write-Host "6. Verifique se a lista é atualizada automaticamente" -ForegroundColor White 