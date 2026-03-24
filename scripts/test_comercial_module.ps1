# Script para testar o módulo comercial após correções
Write-Host "=== Teste do Módulo Comercial - Após Correções ===" -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:8081"
$loginUrl = "$baseUrl/api/auth/login"
$testEndpoints = @(
    "/api/clients",
    "/api/contracts", 
    "/api/proposals",
    "/api/quotes",
    "/api/leads",
    "/api/orders",
    "/api/benefits",
    "/api/notifications/panel"
)

# Dados de login do Super Admin
$loginData = @{
    username = "superadmin"
    password = "superadmin123"
} | ConvertTo-Json

Write-Host "`n1. Fazendo login como Super Admin..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers para as requisições
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n2. Testando endpoints do módulo comercial..." -ForegroundColor Yellow

foreach ($endpoint in $testEndpoints) {
    $url = "$baseUrl$endpoint"
    Write-Host "`nTestando: $endpoint" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
        Write-Host "✓ Sucesso! Status: $($response.GetType().Name)" -ForegroundColor Green
        
        # Mostrar alguns detalhes da resposta
        if ($response -and $response.GetType().Name -eq "PSCustomObject") {
            if ($response.content) {
                Write-Host "  - Total de itens: $($response.content.Count)" -ForegroundColor Gray
            } elseif ($response.length) {
                Write-Host "  - Total de itens: $($response.length)" -ForegroundColor Gray
            }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "✗ Erro $statusCode`: $($_.Exception.Message)" -ForegroundColor Red
        
        # Mostrar detalhes do erro se disponível
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Detalhes: $responseBody" -ForegroundColor DarkRed
        }
    }
}

Write-Host "`n3. Testando endpoints específicos com parâmetros..." -ForegroundColor Yellow

# Teste específico para clientes com paginação
Write-Host "`nTestando: /api/clients com paginação" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/clients?page=0&size=5" -Method GET -Headers $headers
    Write-Host "✓ Sucesso! Página 0 com 5 itens" -ForegroundColor Green
    if ($response.content) {
        Write-Host "  - Total de itens na página: $($response.content.Count)" -ForegroundColor Gray
        Write-Host "  - Total geral: $($response.totalElements)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste específico para contratos
Write-Host "`nTestando: /api/contracts com paginação" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/contracts?page=0&size=5" -Method GET -Headers $headers
    Write-Host "✓ Sucesso! Página 0 com 5 itens" -ForegroundColor Green
    if ($response.content) {
        Write-Host "  - Total de itens na página: $($response.content.Count)" -ForegroundColor Gray
        Write-Host "  - Total geral: $($response.totalElements)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Teste Concluído ===" -ForegroundColor Green
Write-Host "Se todos os endpoints retornaram sucesso, as correções funcionaram!" -ForegroundColor Green 