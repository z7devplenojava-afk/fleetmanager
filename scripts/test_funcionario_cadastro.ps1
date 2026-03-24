# Script para testar o cadastro de funcionários
# Autor: Assistente
# Data: 2025-06-25

Write-Host "=== Teste de Cadastro de Funcionários ===" -ForegroundColor Green

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
        return $false
    }
}

# Função para buscar posições
function Get-Positions {
    Write-Host "Buscando posições..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/positions" -Method GET -Headers $headers
        Write-Host "Posições encontradas: $($response.Count)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Erro ao buscar posições: $($_.Exception.Message)" -ForegroundColor Red
        return @()
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

# Função para buscar usuários
function Get-Users {
    Write-Host "Buscando usuários..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers $headers
        Write-Host "Usuários encontrados: $($response.Count)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Erro ao buscar usuários: $($_.Exception.Message)" -ForegroundColor Red
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
        positionId = $positionId
        unitId = $unitId
        userId = $userId
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

# Função para buscar funcionários
function Get-Employees {
    Write-Host "Buscando funcionários..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/employees" -Method GET -Headers $headers
        Write-Host "Funcionários encontrados: $($response.Count)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "Erro ao buscar funcionários: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

# Execução principal
Write-Host "Iniciando testes..." -ForegroundColor Cyan

# 1. Login
if (-not (Get-AuthToken)) {
    Write-Host "Falha no login. Abortando testes." -ForegroundColor Red
    exit 1
}

# 2. Buscar dados para os selects
$positions = Get-Positions
$units = Get-Units
$users = Get-Users

if ($positions.Count -eq 0) {
    Write-Host "Nenhuma posição encontrada. Criando posição de teste..." -ForegroundColor Yellow
    
    $positionData = @{
        name = "Vigilante"
        description = "Cargo de vigilante"
        baseSalary = 1500.00
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $newPosition = Invoke-RestMethod -Uri "$baseUrl/api/positions" -Method POST -Body $positionData -Headers $headers
        $positions = @($newPosition)
        Write-Host "Posição criada: $($newPosition.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Erro ao criar posição: $($_.Exception.Message)" -ForegroundColor Red
    }
}

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

# 3. Criar funcionário de teste
if ($positions.Count -gt 0 -and $units.Count -gt 0) {
    $positionId = $positions[0].id
    $unitId = $units[0].id
    $userId = if ($users.Count -gt 0) { $users[0].id } else { "" }
    
    $employee = New-Employee -name "Pedro Henrique Mendes" -cpf "321.654.987-00" -rg "32.165.498-7" -email "pedro.mendes@promovervigilancia.com.br" -phone "31944443333" -address "Rua das Flores, 123" -birthDate "1990-05-15" -maritalStatus "MARRIED" -nationality "Brasileiro" -registrationNumber "MOT001" -hireDate "2024-05-30" -positionId $positionId -unitId $unitId -userId $userId
    
    if ($employee) {
        Write-Host "Funcionário criado com sucesso!" -ForegroundColor Green
        Write-Host "Detalhes: $($employee | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    }
}

# 4. Listar funcionários
$employees = Get-Employees
if ($employees.Count -gt 0) {
    Write-Host "Funcionários cadastrados:" -ForegroundColor Green
    foreach ($emp in $employees) {
        Write-Host "- $($emp.name) (ID: $($emp.id))" -ForegroundColor White
    }
}

Write-Host "=== Teste concluído ===" -ForegroundColor Green 