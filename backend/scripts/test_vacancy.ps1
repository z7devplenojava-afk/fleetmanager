$token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzdXBlcmFkbWluIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzUwODAxMzk1LCJleHAiOjE3NTE0MDYxOTV9.HSXM82hylhaUR_67gB_0TCli2ESyZh6PEY6dRMzISiNcs9B4BNB9EYDyUmZTVGEnNfdyf7uOIGEYIZ4n_N4QwQ"

$body = @{
    title = "Vigilante"
    position = "Vigilante"
    function = "Segurança"
    location = "São Paulo"
    workSchedule = "8h/dia"
    salary = 2500.00
    deadline = "2025-07-30T23:59:59"
    requirements = @("Ensino médio completo", "Disponibilidade para plantões")
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/hr/vacancies" -Method POST -Headers $headers -Body $body
    Write-Host "Sucesso! Vaga criada:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro na requisição:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
} 