# Script para testar edição de registros de abastecimento
Write-Host "=== Teste de Edição de Registros de Abastecimento ===" -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:8081"
$loginUrl = "$baseUrl/api/auth/login"
$fuelRecordsUrl = "$baseUrl/api/fuel-records"

# Dados de login
$loginData = @{
    username = "superadmin"
    password = "Password123!"
} | ConvertTo-Json

Write-Host "1. Fazendo login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers para as requisições
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n2. Listando registros de abastecimento..." -ForegroundColor Yellow
try {
    $fuelRecords = Invoke-RestMethod -Uri $fuelRecordsUrl -Method GET -Headers $headers
    Write-Host "Encontrados $($fuelRecords.Count) registros de abastecimento" -ForegroundColor Green
    
    if ($fuelRecords.Count -eq 0) {
        Write-Host "Nenhum registro encontrado. Criando um registro de teste..." -ForegroundColor Yellow
        
        # Criar um registro de teste
        $createData = @{
            vehicleId = "00000000-0000-0000-0000-000000000001"  # ID de teste
            date = "2024-01-15"
            fuelType = "GASOLINE"
            quantity = 50.0
            cost = 250.00
            mileage = 45000
            station = "Posto Teste"
            notes = "Registro criado para teste"
        } | ConvertTo-Json
        
        try {
            $newRecord = Invoke-RestMethod -Uri $fuelRecordsUrl -Method POST -Body $createData -Headers $headers
            Write-Host "Registro de teste criado com ID: $($newRecord.id)" -ForegroundColor Green
            $fuelRecords = @($newRecord)
        } catch {
            Write-Host "Erro ao criar registro de teste: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Verifique se existe um veículo com ID válido no sistema" -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Mostrar o primeiro registro
    $firstRecord = $fuelRecords[0]
    Write-Host "`nPrimeiro registro:" -ForegroundColor Cyan
    Write-Host "ID: $($firstRecord.id)"
    Write-Host "Veículo: $($firstRecord.vehiclePlate)"
    Write-Host "Data: $($firstRecord.date)"
    Write-Host "Litros: $($firstRecord.quantity)"
    Write-Host "Valor: R$ $($firstRecord.cost)"
    Write-Host "Posto: $($firstRecord.station)"
    
} catch {
    Write-Host "Erro ao listar registros: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Testar edição
if ($fuelRecords.Count -gt 0) {
    $recordToEdit = $fuelRecords[0]
    $editUrl = "$fuelRecordsUrl/$($recordToEdit.id)"
    
    Write-Host "`n3. Testando edição do registro..." -ForegroundColor Yellow
    
    # Dados para edição
    $editData = @{
        vehicleId = $recordToEdit.vehicleId
        date = "2024-01-20"  # Nova data
        fuelType = "ETHANOL"  # Novo tipo de combustível
        quantity = 45.0  # Nova quantidade
        cost = 180.00  # Novo valor
        mileage = 48000  # Nova quilometragem
        station = "Posto Atualizado"  # Novo posto
        notes = "Registro atualizado via teste"  # Nova observação
    } | ConvertTo-Json
    
    try {
        $updatedRecord = Invoke-RestMethod -Uri $editUrl -Method PUT -Body $editData -Headers $headers
        Write-Host "Registro atualizado com sucesso!" -ForegroundColor Green
        Write-Host "`nRegistro após edição:" -ForegroundColor Cyan
        Write-Host "ID: $($updatedRecord.id)"
        Write-Host "Veículo: $($updatedRecord.vehiclePlate)"
        Write-Host "Data: $($updatedRecord.date)"
        Write-Host "Tipo: $($updatedRecord.fuelType)"
        Write-Host "Litros: $($updatedRecord.quantity)"
        Write-Host "Valor: R$ $($updatedRecord.cost)"
        Write-Host "Quilometragem: $($updatedRecord.mileage)"
        Write-Host "Posto: $($updatedRecord.station)"
        Write-Host "Observações: $($updatedRecord.notes)"
        
    } catch {
        Write-Host "Erro ao editar registro: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Teste concluído ===" -ForegroundColor Green 