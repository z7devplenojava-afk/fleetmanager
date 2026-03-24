# Script para testar a API de Ordens de Serviço
# Execute este script após iniciar o backend

Write-Host "=== Teste da API de Ordens de Serviço ===" -ForegroundColor Yellow

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

# Função para criar uma ordem de serviço
function Create-OrderOfService {
    Write-Host "`n2. Criando ordem de serviço..." -ForegroundColor Cyan
    
    $orderData = @{
        employeeId = 1
        employeeName = "João Silva Santos"
        employeeCpf = "123.456.789-00"
        role = "Segurança Patrimonial"
        company = "Segurança Ltda"
        client = "Shopping Centro"
        workplace = "Posto Shopping Centro"
        salary = 2500.00
        startDate = "2024-01-15"
        endDate = "2024-12-31"
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/orders-of-service" -Method POST -Body $orderData -Headers $headers
        Write-Host "✓ Ordem de serviço criada com sucesso (ID: $($response.id))" -ForegroundColor Green
        return $response.id
    }
    catch {
        Write-Host "✗ Erro ao criar ordem de serviço: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para listar ordens de serviço
function Get-OrdersOfService {
    Write-Host "`n3. Listando ordens de serviço..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/orders-of-service" -Method GET -Headers $headers
        Write-Host "✓ Ordens de serviço listadas com sucesso" -ForegroundColor Green
        Write-Host "Total de ordens: $($response.Count)" -ForegroundColor White
        
        foreach ($order in $response) {
            Write-Host "  - ID: $($order.id), Funcionário: $($order.employeeName), Função: $($order.role)" -ForegroundColor Gray
        }
        
        return $response
    }
    catch {
        Write-Host "✗ Erro ao listar ordens de serviço: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para buscar ordem por ID
function Get-OrderOfServiceById {
    param($orderId)
    
    Write-Host "`n4. Buscando ordem de serviço por ID ($orderId)..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/orders-of-service/$orderId" -Method GET -Headers $headers
        Write-Host "✓ Ordem de serviço encontrada" -ForegroundColor Green
        Write-Host "  Funcionário: $($response.employeeName)" -ForegroundColor White
        Write-Host "  Função: $($response.role)" -ForegroundColor White
        Write-Host "  Empresa: $($response.company)" -ForegroundColor White
        Write-Host "  Salário: R$ $($response.salary)" -ForegroundColor White
        Write-Host "  Assinada: $($response.signed)" -ForegroundColor White
        return $response
    }
    catch {
        Write-Host "✗ Erro ao buscar ordem de serviço: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para assinar ordem de serviço
function Sign-OrderOfService {
    param($orderId)
    
    Write-Host "`n5. Assinando ordem de serviço ($orderId)..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/orders-of-service/$orderId/sign" -Method POST -Headers $headers
        Write-Host "✓ Ordem de serviço assinada com sucesso" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "✗ Erro ao assinar ordem de serviço: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para buscar por funcionário
function Get-OrdersByEmployee {
    param($employeeId)
    
    Write-Host "`n6. Buscando ordens por funcionário ($employeeId)..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/orders-of-service?employeeId=$employeeId" -Method GET -Headers $headers
        Write-Host "✓ Ordens do funcionário listadas com sucesso" -ForegroundColor Green
        Write-Host "Total de ordens: $($response.Count)" -ForegroundColor White
        return $response
    }
    catch {
        Write-Host "✗ Erro ao buscar ordens por funcionário: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para buscar por status de assinatura
function Get-OrdersBySigned {
    param($signed)
    
    Write-Host "`n7. Buscando ordens por status de assinatura ($signed)..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/orders-of-service?signed=$signed" -Method GET -Headers $headers
        Write-Host "✓ Ordens filtradas por assinatura listadas com sucesso" -ForegroundColor Green
        Write-Host "Total de ordens: $($response.Count)" -ForegroundColor White
        return $response
    }
    catch {
        Write-Host "✗ Erro ao buscar ordens por assinatura: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para buscar por termo
function Search-OrdersByTerm {
    param($searchTerm)
    
    Write-Host "`n8. Buscando ordens por termo ($searchTerm)..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/orders-of-service?search=$searchTerm" -Method GET -Headers $headers
        Write-Host "✓ Busca por termo realizada com sucesso" -ForegroundColor Green
        Write-Host "Total de resultados: $($response.Count)" -ForegroundColor White
        return $response
    }
    catch {
        Write-Host "✗ Erro na busca por termo: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Execução dos testes
if (Get-AuthToken) {
    $orderId = Create-OrderOfService
    if ($orderId) {
        Get-OrdersOfService
        Get-OrderOfServiceById -orderId $orderId
        Sign-OrderOfService -orderId $orderId
        Get-OrderOfServiceById -orderId $orderId
        Get-OrdersByEmployee -employeeId 1
        Get-OrdersBySigned -signed $true
        Get-OrdersBySigned -signed $false
        Search-OrdersByTerm -searchTerm "João"
        Search-OrdersByTerm -searchTerm "Segurança"
    }
}

Write-Host "`n=== Teste concluído ===" -ForegroundColor Yellow 