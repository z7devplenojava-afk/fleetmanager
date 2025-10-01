# Script para testar as multas no navegador
Write-Host "=== Teste das Multas no Navegador ===" -ForegroundColor Green

Write-Host "1. Verificando se os serviços estão rodando..." -ForegroundColor Yellow

# Verificar frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "✓ Frontend está rodando em http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend não está rodando" -ForegroundColor Red
    Write-Host "Execute: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Verificar backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/health" -Method GET -TimeoutSec 5
    Write-Host "✓ Backend está rodando em http://localhost:8081" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend não está rodando" -ForegroundColor Red
    Write-Host "Execute: mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Testando API de multas..." -ForegroundColor Yellow
try {
    # Login
    $loginData = @{
        username = "superadmin"
        password = "Password123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    
    # Buscar multas
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $fines = Invoke-RestMethod -Uri "http://localhost:8081/api/fines" -Method GET -Headers $headers
    Write-Host "✓ API retornou $($fines.Count) multas" -ForegroundColor Green
    
    if ($fines.Count -gt 0) {
        Write-Host "  Primeira multa: $($fines[0].description) - R$ $($fines[0].amount)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "✗ Erro ao testar API: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Abrindo navegador..." -ForegroundColor Yellow
try {
    Start-Process "http://localhost:3000"
    Write-Host "✓ Navegador aberto" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao abrir navegador" -ForegroundColor Red
}

Write-Host "`n=== Instruções para testar ===" -ForegroundColor Yellow
Write-Host "1. Faça login com:" -ForegroundColor White
Write-Host "   Usuário: superadmin" -ForegroundColor Cyan
Write-Host "   Senha: Password123!" -ForegroundColor Cyan
Write-Host "`n2. Navegue para: Frota > Multas" -ForegroundColor White
Write-Host "`n3. Verifique se a multa aparece na lista" -ForegroundColor White
Write-Host "`n4. Abra o DevTools (F12) e verifique:" -ForegroundColor White
Write-Host "   - Console: logs de debug" -ForegroundColor Cyan
Write-Host "   - Network: requisições para /api/fines" -ForegroundColor Cyan
Write-Host "   - Erros de JavaScript" -ForegroundColor Cyan

Write-Host "`n=== Logs esperados no console ===" -ForegroundColor Yellow
Write-Host "Fines data: [array com 1 multa]" -ForegroundColor Cyan
Write-Host "Fines loading: false" -ForegroundColor Cyan
Write-Host "Fines error: null" -ForegroundColor Cyan
Write-Host "Multas component: [array com 1 multa mapeada]" -ForegroundColor Cyan

Write-Host "`n=== Teste concluído ===" -ForegroundColor Green 