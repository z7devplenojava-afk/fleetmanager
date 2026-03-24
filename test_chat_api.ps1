# Script para testar login e APIs do chat
Write-Host "Testando login e APIs do chat..." -ForegroundColor Green

# Dados de login
$loginData = @{
    username = "jose.ramos"
    password = "Password123!"
} | ConvertTo-Json

# Fazer login
Write-Host "Fazendo login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login bem-sucedido!" -ForegroundColor Green
    
    # Extrair token
    $token = $loginResponse.token
    Write-Host "Token obtido: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    # Headers para as requisições
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Testar API de conversas recentes
    Write-Host "Testando GET /api/v1/chat/recent..." -ForegroundColor Yellow
    try {
        $chatResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/chat/recent" -Method GET -Headers $headers
        Write-Host "✅ API de chat funcionando!" -ForegroundColor Green
        Write-Host "Conversas encontradas: $($chatResponse.Count)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro na API de chat: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Testar API de usuários disponíveis
    Write-Host "Testando GET /api/v1/chat/users..." -ForegroundColor Yellow
    try {
        $usersResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/chat/users" -Method GET -Headers $headers
        Write-Host "✅ API de usuários funcionando!" -ForegroundColor Green
        Write-Host "Usuários encontrados: $($usersResponse.Count)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro na API de usuários: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Testar API de work-posts
    Write-Host "Testando GET /api/work-posts/all..." -ForegroundColor Yellow
    try {
        $workPostsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/work-posts/all" -Method GET -Headers $headers
        Write-Host "✅ API de work-posts funcionando!" -ForegroundColor Green
        Write-Host "Work posts encontrados: $($workPostsResponse.Count)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro na API de work-posts: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
}
