# Teste de login para o usuario jose.ramos
$baseUrl = "http://localhost:8081"
$loginUrl = "$baseUrl/api/auth/login"

# Dados de login
$loginData = @{
    username = "jose.ramos"
    password = "Admin1234"
} | ConvertTo-Json

Write-Host "Testando login do usuario jose.ramos..."
Write-Host "URL: $loginUrl"
Write-Host "Dados: $loginData"
Write-Host ""

try {
    # Fazer login
    $response = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "Login bem-sucedido!"
    Write-Host "Token: $($response.token)"
    Write-Host "Refresh Token: $($response.refreshToken)"
    Write-Host "Usuario: $($response.user.username)"
    Write-Host "Role: $($response.user.role)"
    Write-Host ""
    
    # Testar acesso aos endpoints da frota com o token
    $headers = @{
        "Authorization" = "Bearer $($response.token)"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Testando acesso aos endpoints da frota..."
    
    # Testar /api/vehicles
    try {
        $vehiclesResponse = Invoke-RestMethod -Uri "$baseUrl/api/vehicles" -Method GET -Headers $headers
        Write-Host "/api/vehicles - Acesso permitido"
    } catch {
        Write-Host "/api/vehicles - Erro: $($_.Exception.Message)"
    }
    
    # Testar /api/fines
    try {
        $finesResponse = Invoke-RestMethod -Uri "$baseUrl/api/fines" -Method GET -Headers $headers
        Write-Host "/api/fines - Acesso permitido"
    } catch {
        Write-Host "/api/fines - Erro: $($_.Exception.Message)"
    }
    
    # Testar /api/fuel-records
    try {
        $fuelResponse = Invoke-RestMethod -Uri "$baseUrl/api/fuel-records" -Method GET -Headers $headers
        Write-Host "/api/fuel-records - Acesso permitido"
    } catch {
        Write-Host "/api/fuel-records - Erro: $($_.Exception.Message)"
    }
    
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody"
    }
} 