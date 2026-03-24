# Script para testar o cadastro de cargos (positions)
# Autor: Assistente
# Data: 2025-06-25

Write-Host "=== Teste de Cadastro de Cargos (Positions) ===" -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:8080"
$token = ""

# Função para fazer login e obter token
function Get-AuthToken {
    Write-Host "Fazendo login..." -ForegroundColor Yellow
    
    $loginData = @{
        email = "admin@promovervigilancia.com.br"
        password = "admin123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        $script:token = $response.token
        Write-Host "Login realizado com sucesso!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Erro no login: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $responseBody" -ForegroundColor Red
        }
        return $false
    }
}

# Função para buscar unidades
function Get-Units {
    Write-Host "Buscando unidades..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/units" -Method GET -Headers $headers
        Write-Host "Unidades encontradas: $($response.Count)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Erro ao buscar unidades: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

# Função para criar cargo
function New-Position {
    param(
        [string]$name,
        [string]$description,
        [double]$baseSalary,
        [string]$unitId
    )
    
    Write-Host "Criando cargo: $name" -ForegroundColor Yellow
    
    $positionData = @{
        name = $name
        description = $description
        baseSalary = $baseSalary
        unit = @{
            id = $unitId
        }
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/positions" -Method POST -Body $positionData -Headers $headers
        Write-Host "Cargo criado com sucesso! ID: $($response.id)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Erro ao criar cargo: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $responseBody" -ForegroundColor Red
        }
        return $null
    }
}

# Função para buscar cargos
function Get-Positions {
    Write-Host "Buscando cargos..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/positions" -Method GET -Headers $headers
        Write-Host "Cargos encontrados: $($response.Count)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Erro ao buscar cargos: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

# Função para criar funcionário
function New-Employee {
    param(
        [string]$name,
        [string]$cpf,
        [string]$rg,
        [string]$email,
        [string]$phone,
        [string]$address,
        [string]$birthDate,
        [string]$maritalStatus,
        [string]$nationality,
        [string]$registrationNumber,
        [string]$hireDate,
        [string]$positionId,
        [string]$unitId,
        [string]$userId
    )
    
    Write-Host "Criando funcionário: $name" -ForegroundColor Yellow
    
    $employeeData = @{
        name = $name
        cpf = $cpf
        rg = $rg
        email = $email
        phone = $phone
        address = $address
        birthDate = $birthDate
        maritalStatus = $maritalStatus
        nationality = $nationality
        registrationNumber = $registrationNumber
        hireDate = $hireDate
        status = "ACTIVE"
        position = @{
            id = $positionId
        }
        unit = @{
            id = $unitId
        }
        user = @{
            id = $userId
        }
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/employees" -Method POST -Body $employeeData -Headers $headers
        Write-Host "Funcionário criado com sucesso! ID: $($response.id)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Erro ao criar funcionário: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $responseBody" -ForegroundColor Red
        }
        return $null
    }
}

# Execução principal
Write-Host "Iniciando testes..." -ForegroundColor Cyan

# 1. Login
if (-not (Get-AuthToken)) {
    Write-Host "Falha no login. Abortando testes." -ForegroundColor Red
    exit 1
}

# 2. Buscar unidades
$units = Get-Units

if ($units.Count -eq 0) {
    Write-Host "Nenhuma unidade encontrada. Criando unidade de teste..." -ForegroundColor Yellow
    
    $unitData = @{
        name = "Matriz"
        description = "Unidade matriz"
        address = "Rua Teste, 123"
        phone = "31999999999"
        email = "matriz@teste.com"
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $newUnit = Invoke-RestMethod -Uri "$baseUrl/api/units" -Method POST -Body $unitData -Headers $headers
        $units = @($newUnit)
        Write-Host "Unidade criada: $($newUnit.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Erro ao criar unidade: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Criar cargos de teste
if ($units.Count -gt 0) {
    $unitId = $units[0].id
    
    # Criar cargo de Vigilante
    $vigilantePosition = New-Position -name "Vigilante" -description "Cargo de vigilante" -baseSalary 1500.00 -unitId $unitId
    
    # Criar cargo de Supervisor
    $supervisorPosition = New-Position -name "Supervisor" -description "Cargo de supervisor" -baseSalary 2500.00 -unitId $unitId
    
    # Criar cargo de Gerente
    $gerentePosition = New-Position -name "Gerente" -description "Cargo de gerente" -baseSalary 3500.00 -unitId $unitId
}

# 4. Listar cargos
$positions = Get-Positions
if ($positions.Count -gt 0) {
    Write-Host "Cargos cadastrados:" -ForegroundColor Green
    foreach ($pos in $positions) {
        Write-Host "- $($pos.name) (ID: $($pos.id)) - Salário: R$ $($pos.baseSalary)" -ForegroundColor White
    }
}

# 5. Testar criação de funcionário com o formato correto
if ($positions.Count -gt 0 -and $units.Count -gt 0) {
    $positionId = $positions[0].id
    $unitId = $units[0].id
    
    $employee = New-Employee -name "Pedro Henrique Mendes" -cpf "321.654.987-00" -rg "32.165.498-7" -email "pedro.mendes@promovervigilancia.com.br" -phone "31944443333" -address "Rua das Flores, 123" -birthDate "1990-05-15" -maritalStatus "MARRIED" -nationality "Brasileiro" -registrationNumber "MOT001" -hireDate "2024-05-30" -positionId $positionId -unitId $unitId -userId ""
    
    if ($employee) {
        Write-Host "Funcionário criado com sucesso!" -ForegroundColor Green
        Write-Host "Detalhes: $($employee | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    }
}

Write-Host "=== Teste concluído ===" -ForegroundColor Green 