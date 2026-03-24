# Script para testar os endpoints de RH
# Execute este script após iniciar o backend

Write-Host "=== Teste dos Endpoints de RH ===" -ForegroundColor Yellow

# Configurações
$baseUrl = "http://localhost:8080"
$token = ""

# Função para fazer login e obter token
function Get-AuthToken {
    Write-Host "`n1. Fazendo login..." -ForegroundColor Cyan
    
    $loginData = @{
        email = "admin@seguranca.com"
        password = "admin123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        $script:token = $response.token
        Write-Host "✓ Login realizado com sucesso" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar endpoint de funcionários com experiência vencendo
function Test-ProbationExpiring {
    Write-Host "`n2. Testando endpoint de funcionários com experiência vencendo..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/hr/employees/probation-expiring?days=7" -Method GET -Headers $headers
        Write-Host "✓ Endpoint funcionando" -ForegroundColor Green
        Write-Host "Total de funcionários: $($response.Count)" -ForegroundColor White
        
        foreach ($emp in $response) {
            Write-Host "  - $($emp.name) ($($emp.cpf))" -ForegroundColor Gray
        }
        
        return $true
    }
    catch {
        Write-Host "✗ Erro no endpoint: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
        }
        return $false
    }
}

# Função para testar endpoint de estatísticas
function Test-HRStats {
    Write-Host "`n3. Testando endpoint de estatísticas de RH..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/hr/stats" -Method GET -Headers $headers
        Write-Host "✓ Endpoint funcionando" -ForegroundColor Green
        Write-Host "Estatísticas obtidas:" -ForegroundColor White
        Write-Host "  - Total de funcionários: $($response.totalEmployees)" -ForegroundColor Gray
        Write-Host "  - Funcionários ativos: $($response.activeEmployees)" -ForegroundColor Gray
        Write-Host "  - De férias: $($response.onVacation)" -ForegroundColor Gray
        Write-Host "  - De licença médica: $($response.onSickLeave)" -ForegroundColor Gray
        Write-Host "  - Experiência vencendo: $($response.probationExpiring)" -ForegroundColor Gray
        
        return $true
    }
    catch {
        Write-Host "✗ Erro no endpoint: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $errorBody" -ForegroundColor Red
        }
        return $false
    }
}

# Função para testar endpoint de funcionários ativos
function Test-ActiveEmployees {
    Write-Host "`n4. Testando endpoint de funcionários ativos..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/hr/employees/active" -Method GET -Headers $headers
        Write-Host "✓ Endpoint funcionando" -ForegroundColor Green
        Write-Host "Total de funcionários ativos: $($response.Count)" -ForegroundColor White
        
        return $true
    }
    catch {
        Write-Host "✗ Erro no endpoint: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar endpoint de funcionários de férias
function Test-EmployeesOnVacation {
    Write-Host "`n5. Testando endpoint de funcionários de férias..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/hr/employees/on-vacation" -Method GET -Headers $headers
        Write-Host "✓ Endpoint funcionando" -ForegroundColor Green
        Write-Host "Total de funcionários de férias: $($response.Count)" -ForegroundColor White
        
        return $true
    }
    catch {
        Write-Host "✗ Erro no endpoint: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar endpoint de funcionários de licença médica
function Test-EmployeesOnSickLeave {
    Write-Host "`n6. Testando endpoint de funcionários de licença médica..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/hr/employees/on-sick-leave" -Method GET -Headers $headers
        Write-Host "✓ Endpoint funcionando" -ForegroundColor Green
        Write-Host "Total de funcionários de licença médica: $($response.Count)" -ForegroundColor White
        
        return $true
    }
    catch {
        Write-Host "✗ Erro no endpoint: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Execução dos testes
if (Get-AuthToken) {
    $successCount = 0
    $totalTests = 5
    
    if (Test-ProbationExpiring) { $successCount++ }
    if (Test-HRStats) { $successCount++ }
    if (Test-ActiveEmployees) { $successCount++ }
    if (Test-EmployeesOnVacation) { $successCount++ }
    if (Test-EmployeesOnSickLeave) { $successCount++ }
    
    Write-Host "`n=== Resumo dos Testes ===" -ForegroundColor Yellow
    Write-Host "Testes bem-sucedidos: $successCount/$totalTests" -ForegroundColor White
    
    if ($successCount -eq $totalTests) {
        Write-Host "✓ Todos os endpoints de RH estão funcionando!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Alguns endpoints podem ter problemas" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Teste concluído ===" -ForegroundColor Yellow 