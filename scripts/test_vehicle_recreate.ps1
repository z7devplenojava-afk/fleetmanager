# Teste de Recriação de Veículos após Exclusão
Write-Host "=== TESTE DE RECRIAÇÃO DE VEÍCULOS ===" -ForegroundColor Yellow

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

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Verificar se o veículo já existe
Write-Host "`n2. Verificando se o veículo de teste já existe..." -ForegroundColor Cyan
$testPlate = "RECREATE-123"

try {
    $existingVehicle = Invoke-RestMethod -Uri "$apiUrl/vehicles/plate/$testPlate" -Method GET -Headers $headers
    Write-Host "⚠️ Veículo já existe, será excluído primeiro" -ForegroundColor Yellow
    Write-Host "  ID: $($existingVehicle.id)" -ForegroundColor Gray
    Write-Host "  Placa: $($existingVehicle.plate)" -ForegroundColor Gray
    
    # Excluir o veículo existente
    Write-Host "`n3. Excluindo veículo existente..." -ForegroundColor Cyan
    Invoke-RestMethod -Uri "$apiUrl/vehicles/$($existingVehicle.id)" -Method DELETE -Headers $headers
    Write-Host "✅ Veículo excluído com sucesso" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Veículo não existe, pode prosseguir" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao verificar veículo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Criar novo veículo
Write-Host "`n4. Criando novo veículo..." -ForegroundColor Cyan
$newVehicle = @{
    plate = $testPlate
    brand = "Toyota"
    model = "Corolla"
    year = 2023
    color = "Prata"
    fuelType = "FLEX"
    currentMileage = 10000
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
    
    $vehicleId = $createResponse.id
} catch {
    Write-Host "❌ Erro ao criar veículo: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
    exit 1
}

# 4. Verificar se o veículo foi criado
Write-Host "`n5. Verificando se o veículo foi criado..." -ForegroundColor Cyan
try {
    $createdVehicle = Invoke-RestMethod -Uri "$apiUrl/vehicles/$vehicleId" -Method GET -Headers $headers
    Write-Host "✅ Veículo encontrado na base de dados" -ForegroundColor Green
    Write-Host "  Placa: $($createdVehicle.plate)" -ForegroundColor Gray
    Write-Host "  Status: $($createdVehicle.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao buscar veículo criado: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Excluir o veículo
Write-Host "`n6. Excluindo o veículo..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$apiUrl/vehicles/$vehicleId" -Method DELETE -Headers $headers
    Write-Host "✅ Veículo excluído com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao excluir veículo: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Verificar se o veículo foi excluído
Write-Host "`n7. Verificando se o veículo foi excluído..." -ForegroundColor Cyan
try {
    $deletedVehicle = Invoke-RestMethod -Uri "$apiUrl/vehicles/$vehicleId" -Method GET -Headers $headers
    Write-Host "❌ Erro: Veículo ainda existe após exclusão" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Veículo foi excluído corretamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro inesperado ao verificar exclusão: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 7. Tentar recriar o veículo com a mesma placa
Write-Host "`n8. Tentando recriar o veículo com a mesma placa..." -ForegroundColor Cyan
try {
    $recreateResponse = Invoke-RestMethod -Uri "$apiUrl/vehicles" -Method POST -Body $newVehicle -Headers $headers
    Write-Host "✅ Veículo recriado com sucesso!" -ForegroundColor Green
    Write-Host "  ID: $($recreateResponse.id)" -ForegroundColor Gray
    Write-Host "  Placa: $($recreateResponse.plate)" -ForegroundColor Gray
    
    # Limpar - excluir o veículo recriado
    Write-Host "`n9. Limpando - excluindo veículo recriado..." -ForegroundColor Cyan
    Invoke-RestMethod -Uri "$apiUrl/vehicles/$($recreateResponse.id)" -Method DELETE -Headers $headers
    Write-Host "✅ Veículo recriado excluído" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao recriar veículo: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Yellow
Write-Host "`nSe o teste passou, o problema pode estar no frontend." -ForegroundColor Cyan
Write-Host "Se falhou na recriação, o problema está no backend." -ForegroundColor Cyan 