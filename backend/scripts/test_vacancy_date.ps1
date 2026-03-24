# Ler o token do arquivo sem quebras de linha
$token = (Get-Content "token.txt" -Raw).Trim()

$body = @{
    title = "Vigilante"
    position = "Vigilante"
    function = "Segurança"
    location = "São Paulo"
    workSchedule = "8h/dia"
    salary = 2500.00
    deadline = "2025-07-30"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "Enviando requisição para criar vaga (data simples)..." -ForegroundColor Yellow
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