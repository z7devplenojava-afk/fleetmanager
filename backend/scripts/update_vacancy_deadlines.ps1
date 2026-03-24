$token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzdXBlcmFkbWluIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzUwODAxMzk1LCJleHAiOjE3NTE0MDYxOTV9.HSXM82hylhaUR_67gB_0TCli2ESyZh6PEY6dRMzISiNcs9B4BNB9EYDyUmZTVGEnNfdyf7uOIGEYIZ4n_N4QwQ"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Atualizar primeira vaga (Porteiro)
$body1 = @{
    title = "Porteiro"
    position = "Porteiro"
    function = "Atendimento e Controle de Acesso"
    location = "Belo Horizonte, MG"
    requirements = @("Ensino Médio Completo", "Boa comunicação", "Disponibilidade para trabalhar em escala 6x1", "Experiência com atendimento ao público")
    workSchedule = "6x1"
    salary = 1300.00
    benefits = @("Vale refeição", "Vale transporte", "Plano de saúde")
    deadline = "2025-12-31T23:59:59"
    status = "OPEN"
    applications = 3
} | ConvertTo-Json -Depth 10

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:8081/api/hr/vacancies/550e8400-e29b-41d4-a716-446655440002" -Method PUT -Headers $headers -Body $body1
    Write-Host "Vaga 1 (Porteiro) atualizada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao atualizar vaga 1: $($_.Exception.Message)" -ForegroundColor Red
}

# Atualizar segunda vaga (Controlador de Acesso)
$body2 = @{
    title = "Controlador de Acesso"
    position = "Vigilante"
    function = "Controle de Acesso"
    location = "Betim, MG"
    requirements = @("Ensino Médio Completo", "Conhecimento básico de informática", "Disponibilidade para trabalhar em escala 12x36", "Experiência em controle de acesso")
    workSchedule = "12x36"
    salary = 1400.00
    benefits = @("Vale refeição", "Vale transporte", "Plano de saúde", "Plano odontológico")
    deadline = "2025-12-31T23:59:59"
    status = "OPEN"
    applications = 2
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:8081/api/hr/vacancies/550e8400-e29b-41d4-a716-446655440003" -Method PUT -Headers $headers -Body $body2
    Write-Host "Vaga 2 (Controlador de Acesso) atualizada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao atualizar vaga 2: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar endpoint público
Write-Host "`nTestando endpoint público..." -ForegroundColor Yellow
try {
    $publicResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/public/vacancies" -Method GET
    Write-Host "Vagas públicas encontradas: $($publicResponse.Count)" -ForegroundColor Green
    $publicResponse | ForEach-Object {
        Write-Host "- $($_.title) (Deadline: $($_.deadline))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Erro ao testar endpoint público: $($_.Exception.Message)" -ForegroundColor Red
} 