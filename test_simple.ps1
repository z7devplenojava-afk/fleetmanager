$baseUrl = "http://localhost:8081"

Write-Host "Fazendo login..."
$loginData = '{"username":"jose.ramos","password":"123456"}'
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"

if ($loginResponse.token) {
    Write-Host "Login realizado com sucesso!"
    $token = $loginResponse.token
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Buscando multas..."
    $finesResponse = Invoke-RestMethod -Uri "$baseUrl/api/fines" -Method GET -Headers $headers
    
    Write-Host "Multas encontradas: $($finesResponse.Count)"
    foreach ($fine in $finesResponse) {
        Write-Host "ID: $($fine.id)"
        Write-Host "Veiculo: $($fine.vehiclePlate)"
        Write-Host "Motorista: $($fine.driverName)"
        Write-Host "Status: $($fine.status)"
        Write-Host "Valor: R$ $($fine.amount)"
        Write-Host "---"
    }
    
    Write-Host "Testando relatorio PDF..."
    try {
        Invoke-WebRequest -Uri "$baseUrl/api/fines/reports/pdf" -Method GET -Headers $headers -OutFile "test_report.pdf"
        Write-Host "Relatorio PDF gerado com sucesso!"
    }
    catch {
        Write-Host "Erro: $($_.Exception.Message)"
    }
}
else {
    Write-Host "Falha no login"
}
