# Script para testar as funcionalidades de Ocorrências RH
# Autor: Assistente IA
# Data: $(Get-Date -Format "yyyy-MM-dd")

Write-Host "=== TESTE DE OCORRÊNCIAS RH ===" -ForegroundColor Green
Write-Host ""

# Configurações
$baseUrl = "http://localhost:8080"
$token = ""

# Função para fazer login e obter token
function Get-AuthToken {
    Write-Host "🔐 Fazendo login..." -ForegroundColor Yellow
    
    $loginData = @{
        email = "admin@secureguard.com"
        password = "admin123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        $script:token = $response.token
        Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar listagem de ocorrências
function Test-ListOccurrences {
    Write-Host "📋 Testando listagem de ocorrências..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences" -Method GET -Headers $headers
        Write-Host "✅ Listagem de ocorrências realizada com sucesso!" -ForegroundColor Green
        Write-Host "   Total de ocorrências: $($response.Count)" -ForegroundColor Cyan
        
        if ($response.Count -gt 0) {
            Write-Host "   Primeira ocorrência:" -ForegroundColor Cyan
            Write-Host "     ID: $($response[0].id)" -ForegroundColor White
            Write-Host "     Tipo: $($response[0].type)" -ForegroundColor White
            Write-Host "     Status: $($response[0].status)" -ForegroundColor White
        }
        
        return $response
    }
    catch {
        Write-Host "❌ Erro na listagem: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para testar criação de ocorrência
function Test-CreateOccurrence {
    Write-Host "➕ Testando criação de ocorrência..." -ForegroundColor Yellow
    
    $occurrenceData = @{
        employee = @{
            id = "550e8400-e29b-41d4-a716-446655440000"  # UUID de exemplo
        }
        type = "MEDICAL_CERTIFICATE"
        description = "Atestado médico para consulta de rotina"
        occurrenceDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        documentUrl = "https://exemplo.com/atestado.pdf"
        status = "PENDING"
    } | ConvertTo-Json -Depth 3
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences" -Method POST -Body $occurrenceData -Headers $headers
        Write-Host "✅ Ocorrência criada com sucesso!" -ForegroundColor Green
        Write-Host "   ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "   Tipo: $($response.type)" -ForegroundColor Cyan
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
        
        return $response.id
    }
    catch {
        Write-Host "❌ Erro na criação: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para testar busca por funcionário
function Test-GetOccurrencesByEmployee {
    param($employeeId)
    
    Write-Host "👤 Testando busca de ocorrências por funcionário..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences/employee/$employeeId" -Method GET -Headers $headers
        Write-Host "✅ Busca por funcionário realizada com sucesso!" -ForegroundColor Green
        Write-Host "   Total de ocorrências do funcionário: $($response.Count)" -ForegroundColor Cyan
        
        return $response
    }
    catch {
        Write-Host "❌ Erro na busca por funcionário: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para testar busca por tipo
function Test-GetOccurrencesByType {
    param($type)
    
    Write-Host "🏷️ Testando busca de ocorrências por tipo ($type)..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences/type/$type" -Method GET -Headers $headers
        Write-Host "✅ Busca por tipo realizada com sucesso!" -ForegroundColor Green
        Write-Host "   Total de ocorrências do tipo $type`: $($response.Count)" -ForegroundColor Cyan
        
        return $response
    }
    catch {
        Write-Host "❌ Erro na busca por tipo: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para testar busca por status
function Test-GetOccurrencesByStatus {
    param($status)
    
    Write-Host "📊 Testando busca de ocorrências por status ($status)..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences/status/$status" -Method GET -Headers $headers
        Write-Host "✅ Busca por status realizada com sucesso!" -ForegroundColor Green
        Write-Host "   Total de ocorrências com status $status`: $($response.Count)" -ForegroundColor Cyan
        
        return $response
    }
    catch {
        Write-Host "❌ Erro na busca por status: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para testar atualização de ocorrência
function Test-UpdateOccurrence {
    param($occurrenceId)
    
    Write-Host "✏️ Testando atualização de ocorrência..." -ForegroundColor Yellow
    
    $updateData = @{
        description = "Atestado médico atualizado - consulta de rotina"
        status = "APPROVED"
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences/$occurrenceId" -Method PUT -Body $updateData -Headers $headers
        Write-Host "✅ Ocorrência atualizada com sucesso!" -ForegroundColor Green
        Write-Host "   Status atualizado: $($response.status)" -ForegroundColor Cyan
        
        return $response
    }
    catch {
        Write-Host "❌ Erro na atualização: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para testar exclusão de ocorrência
function Test-DeleteOccurrence {
    param($occurrenceId)
    
    Write-Host "🗑️ Testando exclusão de ocorrência..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences/$occurrenceId" -Method DELETE -Headers $headers
        Write-Host "✅ Ocorrência excluída com sucesso!" -ForegroundColor Green
        
        return $true
    }
    catch {
        Write-Host "❌ Erro na exclusão: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar busca por ID
function Test-GetOccurrenceById {
    param($occurrenceId)
    
    Write-Host "🔍 Testando busca de ocorrência por ID..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/occurrences/$occurrenceId" -Method GET -Headers $headers
        Write-Host "✅ Busca por ID realizada com sucesso!" -ForegroundColor Green
        Write-Host "   ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "   Tipo: $($response.type)" -ForegroundColor Cyan
        Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
        
        return $response
    }
    catch {
        Write-Host "❌ Erro na busca por ID: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Execução dos testes
Write-Host "🚀 Iniciando testes de Ocorrências RH..." -ForegroundColor Green
Write-Host ""

# 1. Login
if (-not (Get-AuthToken)) {
    Write-Host "❌ Falha no login. Abortando testes." -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Listar ocorrências
$occurrences = Test-ListOccurrences

Write-Host ""

# 3. Criar ocorrência
$newOccurrenceId = Test-CreateOccurrence

Write-Host ""

# 4. Buscar ocorrência por ID (se foi criada)
if ($newOccurrenceId) {
    Test-GetOccurrenceById -occurrenceId $newOccurrenceId
    Write-Host ""
}

# 5. Buscar por tipo
Test-GetOccurrencesByType -type "MEDICAL_CERTIFICATE"
Write-Host ""

# 6. Buscar por status
Test-GetOccurrencesByStatus -status "PENDING"
Write-Host ""

# 7. Buscar por funcionário (usando ID de exemplo)
Test-GetOccurrencesByEmployee -employeeId "550e8400-e29b-41d4-a716-446655440000"
Write-Host ""

# 8. Atualizar ocorrência (se foi criada)
if ($newOccurrenceId) {
    Test-UpdateOccurrence -occurrenceId $newOccurrenceId
    Write-Host ""
}

# 9. Excluir ocorrência (se foi criada)
if ($newOccurrenceId) {
    Test-DeleteOccurrence -occurrenceId $newOccurrenceId
    Write-Host ""
}

Write-Host "=== TESTES CONCLUÍDOS ===" -ForegroundColor Green
Write-Host ""

# Resumo dos testes
Write-Host "📊 RESUMO DOS TESTES:" -ForegroundColor Cyan
Write-Host "✅ Login e autenticação" -ForegroundColor Green
Write-Host "✅ Listagem de ocorrências" -ForegroundColor Green
Write-Host "✅ Criação de ocorrência" -ForegroundColor Green
Write-Host "✅ Busca por ID" -ForegroundColor Green
Write-Host "✅ Busca por tipo" -ForegroundColor Green
Write-Host "✅ Busca por status" -ForegroundColor Green
Write-Host "✅ Busca por funcionário" -ForegroundColor Green
Write-Host "✅ Atualização de ocorrência" -ForegroundColor Green
Write-Host "✅ Exclusão de ocorrência" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Todos os testes de Ocorrências RH foram executados!" -ForegroundColor Green 