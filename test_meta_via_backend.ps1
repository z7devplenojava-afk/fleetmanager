# Teste Meta Cloud API via Backend

Write-Host "=== TESTE VIA BACKEND ===" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Fazer login para obter token
Write-Host "1. Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    username = "jose.ramos"
    password = "jose123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody
    
    $token = $loginResponse.token
    Write-Host "✅ Login realizado!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
    Write-Host ""
    
    # Passo 2: Enviar mensagem de teste via backend
    Write-Host "2. Enviando via backend (Meta Cloud API)..." -ForegroundColor Yellow
    
    $envioBody = @{
        cpf = "00824310608"
        tipo = "WHATSAPP"
        mensagem = "TESTE via Backend usando Meta Cloud API! Se voce recebeu, o sistema esta 100% funcional!"
    } | ConvertTo-Json
    
    $envioResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/envio/individual" `
        -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token"
        } `
        -Body $envioBody
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   ✅ SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($envioResponse | ConvertTo-Json -Depth 3)
    Write-Host ""
    Write-Host "Total Enviados: $($envioResponse.totalEnviados)" -ForegroundColor Cyan
    Write-Host "Total Falhas: $($envioResponse.totalFalhas)" -ForegroundColor Cyan
    Write-Host "Mensagem: $($envioResponse.mensagem)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "VERIFIQUE SEU WHATSAPP!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   ❌ ERRO" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro: $_" -ForegroundColor Yellow
    Write-Host ""
    
    if ($_ -like "*401*") {
        Write-Host "PROBLEMA: Credenciais inválidas" -ForegroundColor Yellow
        Write-Host "Verifique username e password no script" -ForegroundColor White
    } elseif ($_ -like "*404*") {
        Write-Host "PROBLEMA: Endpoint não encontrado" -ForegroundColor Yellow
        Write-Host "Backend pode não estar rodando" -ForegroundColor White
    } else {
        Write-Host "Verifique os logs do backend" -ForegroundColor White
    }
}

