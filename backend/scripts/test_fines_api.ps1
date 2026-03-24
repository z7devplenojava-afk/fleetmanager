# Script para testar a API de multas
Write-Host "=== Teste da API de Multas ===" -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:8081"
$loginUrl = "$baseUrl/api/auth/login"
$finesUrl = "$baseUrl/api/fines"

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

Write-Host "`n2. Listando multas..." -ForegroundColor Yellow
try {
    $fines = Invoke-RestMethod -Uri $finesUrl -Method GET -Headers $headers
    Write-Host "Encontradas $($fines.Count) multas" -ForegroundColor Green
    
    if ($fines.Count -eq 0) {
        Write-Host "Nenhuma multa encontrada. Criando uma multa de teste..." -ForegroundColor Yellow
        
        # Primeiro, vamos buscar um veículo para criar a multa
        $vehiclesUrl = "$baseUrl/api/vehicles"
        $vehicles = Invoke-RestMethod -Uri $vehiclesUrl -Method GET -Headers $headers
        
        if ($vehicles.Count -eq 0) {
            Write-Host "Nenhum veículo encontrado. Não é possível criar multa de teste." -ForegroundColor Red
            exit 1
        }
        
        $vehicle = $vehicles[0]
        Write-Host "Usando veículo: $($vehicle.plate)" -ForegroundColor Cyan
        
        # Criar uma multa de teste
        $createData = @{
            vehicle = @{
                id = $vehicle.id
            }
            date = "2024-01-15"
            description = "Excesso de velocidade - Teste"
            amount = 293.47
            location = "Av. Paulista, 1000 - São Paulo"
            status = "PENDING"
            dueDate = "2024-02-15"
        } | ConvertTo-Json -Depth 3
        
        try {
            $newFine = Invoke-RestMethod -Uri $finesUrl -Method POST -Body $createData -Headers $headers
            Write-Host "Multa de teste criada com ID: $($newFine.id)" -ForegroundColor Green
            $fines = @($newFine)
        } catch {
            Write-Host "Erro ao criar multa de teste: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                $errorResponse = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorResponse)
                $errorBody = $reader.ReadToEnd()
                Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
            }
            exit 1
        }
    }
    
    # Mostrar as multas encontradas
    Write-Host "`nMultas encontradas:" -ForegroundColor Cyan
    foreach ($fine in $fines) {
        Write-Host "ID: $($fine.id)"
        Write-Host "Veículo: $($fine.vehiclePlate)"
        Write-Host "Descrição: $($fine.description)"
        Write-Host "Valor: R$ $($fine.amount)"
        Write-Host "Status: $($fine.status)"
        Write-Host "Data: $($fine.date)"
        Write-Host "Vencimento: $($fine.dueDate)"
        Write-Host "Local: $($fine.location)"
        Write-Host "---"
    }
    
} catch {
    Write-Host "Erro ao listar multas: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n=== Teste concluído ===" -ForegroundColor Green 