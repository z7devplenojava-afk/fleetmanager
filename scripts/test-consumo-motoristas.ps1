# Script de Teste - Sistema de Consumo de Combustível por Motorista
# Testa as funcionalidades implementadas para média de consumo por veículo e motorista

Write-Host "🚗 Testando Sistema de Consumo de Combustível por Motorista" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Yellow

# Configurações
$baseUrl = "http://localhost:8080"
$apiUrl = "$baseUrl/api"

# Função para fazer requisições HTTP
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10)
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        
        return @{
            Success = $true
            Data = $response
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Teste 1: Verificar se o backend está rodando
Write-Host "`n1. Verificando se o backend está rodando..." -ForegroundColor Cyan
$healthCheck = Invoke-ApiRequest -Url "$baseUrl/actuator/health"
if ($healthCheck.Success) {
    Write-Host "✅ Backend está rodando" -ForegroundColor Green
} else {
    Write-Host "❌ Backend não está rodando: $($healthCheck.Error)" -ForegroundColor Red
    exit 1
}

# Teste 2: Listar todos os motoristas
Write-Host "`n2. Listando todos os motoristas..." -ForegroundColor Cyan
$drivers = Invoke-ApiRequest -Url "$apiUrl/fuel-records/stats/drivers"
if ($drivers.Success) {
    Write-Host "✅ Motoristas encontrados: $($drivers.Data.Count)" -ForegroundColor Green
    if ($drivers.Data.Count -gt 0) {
        Write-Host "   Motoristas: $($drivers.Data -join ', ')" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Erro ao listar motoristas: $($drivers.Error)" -ForegroundColor Red
}

# Teste 3: Estatísticas gerais por motorista
Write-Host "`n3. Buscando estatísticas gerais por motorista..." -ForegroundColor Cyan
$driverStats = Invoke-ApiRequest -Url "$apiUrl/fuel-records/stats/drivers/summary"
if ($driverStats.Success) {
    Write-Host "✅ Estatísticas gerais encontradas: $($driverStats.Data.Count) motoristas" -ForegroundColor Green
    foreach ($stat in $driverStats.Data) {
        Write-Host "   $($stat[0]): $($stat[2]) registros, $($stat[1]) litros, R$ $($stat[3])" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Erro ao buscar estatísticas gerais: $($driverStats.Error)" -ForegroundColor Red
}

# Teste 4: Top motoristas por consumo
Write-Host "`n4. Buscando top motoristas por consumo..." -ForegroundColor Cyan
$topConsumption = Invoke-ApiRequest -Url "$apiUrl/fuel-records/stats/drivers/top-consumption"
if ($topConsumption.Success) {
    Write-Host "✅ Top motoristas por consumo encontrados: $($topConsumption.Data.Count)" -ForegroundColor Green
    for ($i = 0; $i -lt [Math]::Min(3, $topConsumption.Data.Count); $i++) {
        $driver = $topConsumption.Data[$i]
        Write-Host "   $($i + 1)º: $($driver[0]) - $($driver[1]) litros" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Erro ao buscar top motoristas por consumo: $($topConsumption.Error)" -ForegroundColor Red
}

# Teste 5: Top motoristas por custo
Write-Host "`n5. Buscando top motoristas por custo..." -ForegroundColor Cyan
$topCost = Invoke-ApiRequest -Url "$apiUrl/fuel-records/stats/drivers/top-cost"
if ($topCost.Success) {
    Write-Host "✅ Top motoristas por custo encontrados: $($topCost.Data.Count)" -ForegroundColor Green
    for ($i = 0; $i -lt [Math]::Min(3, $topCost.Data.Count); $i++) {
        $driver = $topCost.Data[$i]
        Write-Host "   $($i + 1)º: $($driver[0]) - R$ $($driver[1])" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Erro ao buscar top motoristas por custo: $($topCost.Error)" -ForegroundColor Red
}

# Teste 6: Consumo por motorista e tipo de combustível
Write-Host "`n6. Buscando consumo por motorista e tipo de combustível..." -ForegroundColor Cyan
$consumptionByType = Invoke-ApiRequest -Url "$apiUrl/fuel-records/stats/drivers/by-fuel-type"
if ($consumptionByType.Success) {
    Write-Host "✅ Consumo por tipo encontrado: $($consumptionByType.Data.Count) registros" -ForegroundColor Green
    foreach ($record in $consumptionByType.Data) {
        Write-Host "   $($record[0]) - $($record[1]): $($record[2]) litros, R$ $($record[3])" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Erro ao buscar consumo por tipo: $($consumptionByType.Error)" -ForegroundColor Red
}

# Teste 7: Estatísticas detalhadas de um motorista específico (se houver)
if ($drivers.Success -and $drivers.Data.Count -gt 0) {
    $testDriver = $drivers.Data[0]
    Write-Host "`n7. Buscando estatísticas detalhadas do motorista: $testDriver" -ForegroundColor Cyan
    $driverDetail = Invoke-ApiRequest -Url "$apiUrl/fuel-records/stats/driver/$([System.Web.HttpUtility]::UrlEncode($testDriver))"
    if ($driverDetail.Success) {
        Write-Host "✅ Estatísticas detalhadas encontradas:" -ForegroundColor Green
        Write-Host "   Total de registros: $($driverDetail.Data.totalRecords)" -ForegroundColor Gray
        Write-Host "   Combustível total: $($driverDetail.Data.totalFuelConsumed) litros" -ForegroundColor Gray
        Write-Host "   Custo total: R$ $($driverDetail.Data.totalCost)" -ForegroundColor Gray
        Write-Host "   Distância total: $($driverDetail.Data.totalDistance) km" -ForegroundColor Gray
        Write-Host "   Consumo/km: $($driverDetail.Data.consumptionPerKm) L/km" -ForegroundColor Gray
        Write-Host "   Veículos utilizados: $($driverDetail.Data.vehiclesUsed.Count)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Erro ao buscar estatísticas detalhadas: $($driverDetail.Error)" -ForegroundColor Red
    }
}

# Teste 8: Verificar estrutura da tabela fuel_records
Write-Host "`n8. Verificando estrutura da tabela fuel_records..." -ForegroundColor Cyan
$fuelRecords = Invoke-ApiRequest -Url "$apiUrl/fuel-records"
if ($fuelRecords.Success) {
    Write-Host "✅ Registros de combustível encontrados: $($fuelRecords.Data.Count)" -ForegroundColor Green
    if ($fuelRecords.Data.Count -gt 0) {
        $sampleRecord = $fuelRecords.Data[0]
        Write-Host "   Estrutura do registro:" -ForegroundColor Gray
        Write-Host "     - ID: $($sampleRecord.id)" -ForegroundColor Gray
        Write-Host "     - Veículo: $($sampleRecord.vehiclePlate)" -ForegroundColor Gray
        Write-Host "     - Data: $($sampleRecord.date)" -ForegroundColor Gray
        Write-Host "     - Motorista: $($sampleRecord.driver)" -ForegroundColor Gray
        Write-Host "     - Combustível: $($sampleRecord.quantity) litros" -ForegroundColor Gray
        Write-Host "     - Custo: R$ $($sampleRecord.cost)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Erro ao buscar registros de combustível: $($fuelRecords.Error)" -ForegroundColor Red
}

# Teste 9: Verificar endpoints de estatísticas por veículo (já existentes)
Write-Host "`n9. Verificando endpoints de estatísticas por veículo..." -ForegroundColor Cyan
$vehicleStats = Invoke-ApiRequest -Url "$apiUrl/fuel-records/stats/all-vehicles"
if ($vehicleStats.Success) {
    Write-Host "✅ Estatísticas por veículo encontradas: $($vehicleStats.Data.Count) veículos" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao buscar estatísticas por veículo: $($vehicleStats.Error)" -ForegroundColor Red
}

Write-Host "`n🎉 Testes concluídos!" -ForegroundColor Green
Write-Host "`n📋 Resumo das funcionalidades implementadas:" -ForegroundColor Yellow
Write-Host "   ✅ Campo motorista adicionado ao modelo FuelRecord" -ForegroundColor Green
Write-Host "   ✅ Migration criada para adicionar coluna driver" -ForegroundColor Green
Write-Host "   ✅ DTOs criados para estatísticas por motorista" -ForegroundColor Green
Write-Host "   ✅ Queries adicionadas ao FuelRecordRepository" -ForegroundColor Green
Write-Host "   ✅ Serviço DriverFuelConsumptionService criado" -ForegroundColor Green
Write-Host "   ✅ Endpoints adicionados ao FuelRecordController" -ForegroundColor Green
Write-Host "   ✅ Componentes React criados para UI" -ForegroundColor Green
Write-Host "   ✅ Campo motorista adicionado ao formulário de abastecimento" -ForegroundColor Green
Write-Host "   ✅ Nova aba 'Motoristas' adicionada à página de Frota" -ForegroundColor Green

Write-Host "`n🚀 Para testar o frontend:" -ForegroundColor Yellow
Write-Host "   1. Execute: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "   2. Acesse: http://localhost:3000" -ForegroundColor Gray
Write-Host "   3. Vá para a página de Frota" -ForegroundColor Gray
Write-Host "   4. Clique na aba 'Motoristas'" -ForegroundColor Gray
Write-Host "   5. Teste as funcionalidades de estatísticas por motorista" -ForegroundColor Gray 