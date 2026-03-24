# Teste simples de login
$baseUrl = "http://localhost:8080/api"

Write-Host "=== Teste Simples de Login ===" -ForegroundColor Green

# Testar com usuário admin que existe no banco
$loginBody = @{
    email = "admin@teste.com"
    password = "123456"
} | ConvertTo-Json

Write-Host "Tentando login com admin@teste.com..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login bem-sucedido!" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
} 