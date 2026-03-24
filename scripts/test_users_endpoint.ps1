# Teste do endpoint de usuarios
$baseUrl = "http://localhost:8081"
$loginUrl = "$baseUrl/api/auth/login"
$usersUrl = "$baseUrl/api/users"

# Dados de login
$loginData = @{
    username = "jose.ramos"
    password = "Admin1234"
} | ConvertTo-Json

Write-Host "Testando endpoint de usuarios..."
Write-Host ""

try {
    # Fazer login
    $response = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "Login bem-sucedido!"
    Write-Host "Token: $($response.token)"
    Write-Host "Usuario: $($response.user.username)"
    Write-Host "Role: $($response.user.role)"
    Write-Host ""
    
    # Testar acesso ao endpoint de usuários com o token
    $headers = @{
        "Authorization" = "Bearer $($response.token)"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Testando /api/users..."
    
    try {
        $usersResponse = Invoke-RestMethod -Uri $usersUrl -Method GET -Headers $headers
        Write-Host "/api/users - Acesso permitido"
        Write-Host "Total de usuarios: $($usersResponse.Count)"
        
        foreach ($user in $usersResponse) {
            Write-Host "  - $($user.username) ($($user.email)) - Role: $($user.role)"
        }
    } catch {
        Write-Host "/api/users - Erro: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes do erro: $errorBody"
        }
    }
    
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)"
} 