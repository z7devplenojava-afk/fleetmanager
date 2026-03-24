# Ler o token do arquivo sem quebras de linha
$token = (Get-Content "token.txt" -Raw).Trim()

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "Testando GET /api/hr/vacancies..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/hr/vacancies" -Method GET -Headers $headers
    Write-Host "Sucesso! Lista de vagas:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro na requisição GET:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
} 