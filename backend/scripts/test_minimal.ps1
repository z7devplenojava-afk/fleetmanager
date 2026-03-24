# Ler o token do arquivo sem quebras de linha
$token = (Get-Content "token.txt" -Raw).Trim()

$body = @{
    title = "Teste"
    position = "Teste"
    function = "Teste"
    location = "Teste"
    workSchedule = "Teste"
    salary = 1000.00
    deadline = "2025-12-31T23:59:59"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "Enviando requisição mínima..." -ForegroundColor Yellow
Write-Host "Body: $body" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/hr/vacancies" -Method POST -Headers $headers -Body $body
    Write-Host "Sucesso! Vaga criada:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro na requisição:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
} 