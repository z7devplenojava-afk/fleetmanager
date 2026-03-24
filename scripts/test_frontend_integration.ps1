# Teste de integração frontend-backend
$baseUrl = "http://localhost:8081"
$loginUrl = "$baseUrl/api/auth/login"

# Dados de login
$loginData = @{
    username = "jose.ramos"
    password = "Admin1234"
} | ConvertTo-Json

Write-Host "Testando integracao frontend-backend..."
Write-Host ""

try {
    # Fazer login
    $response = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "Login bem-sucedido!"
    Write-Host "Token: $($response.token)"
    Write-Host "Usuario: $($response.user.username)"
    Write-Host "Role: $($response.user.role)"
    Write-Host ""
    
    # Testar acesso aos endpoints principais com o token
    $headers = @{
        "Authorization" = "Bearer $($response.token)"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Testando endpoints principais..."
    
    # Testar /api/users
    try {
        $usersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers $headers
        Write-Host "/api/users - OK (${usersResponse.Count} usuarios)"
    } catch {
        Write-Host "/api/users - ERRO: $($_.Exception.Message)"
    }
    
    # Testar /api/vehicles
    try {
        $vehiclesResponse = Invoke-RestMethod -Uri "$baseUrl/api/vehicles" -Method GET -Headers $headers
        Write-Host "/api/vehicles - OK (${vehiclesResponse.Count} veiculos)"
    } catch {
        Write-Host "/api/vehicles - ERRO: $($_.Exception.Message)"
    }
    
    # Testar /api/fines
    try {
        $finesResponse = Invoke-RestMethod -Uri "$baseUrl/api/fines" -Method GET -Headers $headers
        Write-Host "/api/fines - OK (${finesResponse.Count} multas)"
    } catch {
        Write-Host "/api/fines - ERRO: $($_.Exception.Message)"
    }
    
    # Testar /api/fuel-records
    try {
        $fuelResponse = Invoke-RestMethod -Uri "$baseUrl/api/fuel-records" -Method GET -Headers $headers
        Write-Host "/api/fuel-records - OK (${fuelResponse.Count} registros)"
    } catch {
        Write-Host "/api/fuel-records - ERRO: $($_.Exception.Message)"
    }
    
    # Testar /api/groups
    try {
        $groupsResponse = Invoke-RestMethod -Uri "$baseUrl/api/groups" -Method GET -Headers $headers
        Write-Host "/api/groups - OK (${groupsResponse.Count} grupos)"
    } catch {
        Write-Host "/api/groups - ERRO: $($_.Exception.Message)"
    }
    
    # Testar /api/leads
    try {
        $leadsResponse = Invoke-RestMethod -Uri "$baseUrl/api/leads/all" -Method GET -Headers $headers
        Write-Host "/api/leads - OK (${leadsResponse.Count} leads)"
    } catch {
        Write-Host "/api/leads - ERRO: $($_.Exception.Message)"
    }
    
    # Testar /api/proposals
    try {
        $proposalsResponse = Invoke-RestMethod -Uri "$baseUrl/api/proposals" -Method GET -Headers $headers
        Write-Host "/api/proposals - OK (${proposalsResponse.Count} propostas)"
    } catch {
        Write-Host "/api/proposals - ERRO: $($_.Exception.Message)"
    }
    
    # Testar /api/quotes
    try {
        $quotesResponse = Invoke-RestMethod -Uri "$baseUrl/api/quotes" -Method GET -Headers $headers
        Write-Host "/api/quotes - OK (${quotesResponse.Count} orcamentos)"
    } catch {
        Write-Host "/api/quotes - ERRO: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Write-Host "Teste de integracao concluido!"
    
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)"
} 