$token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzdXBlcmFkbWluIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzUwODAxMzk1LCJleHAiOjE3NTE0MDYxOTV9.HSXM82hylhaUR_67gB_0TCli2ESyZh6PEY6dRMzISiNcs9B4BNB9EYDyUmZTVGEnNfdyf7uOIGEYIZ4n_N4QwQ"

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/hr/vacancies" -Method GET -Headers $headers
    Write-Host "Token válido! Lista de vagas:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro na requisição:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
} 