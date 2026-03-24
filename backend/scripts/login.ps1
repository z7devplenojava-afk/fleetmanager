$loginBody = @{
    username = "superadmin"
    password = "Password123!"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Headers $headers -Body $loginBody
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "Token: $($response.token)" -ForegroundColor Yellow
    
    # Salvar o token em um arquivo para uso posterior
    $response.token | Out-File -FilePath "token.txt" -Encoding UTF8
    Write-Host "Token salvo em token.txt" -ForegroundColor Green
    
} catch {
    Write-Host "Erro no login:" -ForegroundColor Red
    Write-Host $_.Exception.Message
} 