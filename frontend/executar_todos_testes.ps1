# Executar Todos os Testes - EnvioHolerites
# Este script executa todos os testes do sistema

param(
    [string]$BaseUrl = "http://localhost:5173",
    [string]$BackendUrl = "http://localhost:8080",
    [switch]$SkipManual = $false
)

Write-Host "🧪 EXECUTAR TODOS OS TESTES - EnvioHolerites" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Função para executar script e capturar resultado
function Invoke-TestScript {
    param([string]$ScriptPath, [string]$ScriptName)
    
    Write-Host "`n🚀 Executando: $ScriptName" -ForegroundColor Yellow
    Write-Host "=========================" -ForegroundColor Yellow
    
    if (Test-Path $ScriptPath) {
        try {
            & $ScriptPath -BaseUrl $BaseUrl -BackendUrl $BackendUrl
            return $true
        }
        catch {
            Write-Host "❌ Erro ao executar $ScriptName`: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "❌ Script não encontrado: $ScriptPath" -ForegroundColor Red
        return $false
    }
}

# Função para verificar se serviços estão rodando
function Test-Services {
    Write-Host "`n🔍 Verificando Serviços" -ForegroundColor Yellow
    Write-Host "======================" -ForegroundColor Yellow
    
    $services = @(
        @{ Name = "Frontend (Vite)"; Url = $BaseUrl },
        @{ Name = "Backend (Spring Boot)"; Url = "$BackendUrl/api/health" }
    )
    
    $allRunning = $true
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.Url -Method GET -TimeoutSec 5
            Write-Host "✅ $($service.Name): Rodando" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ $($service.Name): Não está rodando" -ForegroundColor Red
            $allRunning = $false
        }
    }
    
    return $allRunning
}

# ===== EXECUÇÃO DOS TESTES =====

# Verificar serviços primeiro
$servicesRunning = Test-Services

if (-not $servicesRunning) {
    Write-Host "`n⚠️ ATENÇÃO: Alguns serviços não estão rodando!" -ForegroundColor Yellow
    Write-Host "Para executar os testes, inicie os serviços:" -ForegroundColor White
    Write-Host "  Backend: cd backend && ./mvnw spring-boot:run" -ForegroundColor Gray
    Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor Gray
    Write-Host "`nDeseja continuar mesmo assim? (s/n)" -ForegroundColor Yellow
    
    $continue = Read-Host
    if ($continue -ne 's' -and $continue -ne 'S') {
        Write-Host "❌ Testes cancelados" -ForegroundColor Red
        exit 1
    }
}

# Array de testes para executar
$tests = @(
    @{ 
        Script = "frontend/test_envio_holerites.ps1"; 
        Name = "Teste de Integração Frontend";
        Required = $true
    },
    @{ 
        Script = "frontend/test_fluxo_completo.ps1"; 
        Name = "Teste de Fluxo Completo";
        Required = $true
    },
    @{ 
        Script = "frontend/verificar_permissoes.ps1"; 
        Name = "Verificação de Permissões";
        Required = $false
    },
    @{ 
        Script = "frontend/test_responsividade.ps1"; 
        Name = "Teste de Responsividade";
        Required = $false
    }
)

# Executar testes
$results = @()
foreach ($test in $tests) {
    $success = Invoke-TestScript -ScriptPath $test.Script -ScriptName $test.Name
    $results += @{
        Name = $test.Name
        Success = $success
        Required = $test.Required
    }
    
    # Pausa entre testes
    if ($test -ne $tests[-1]) {
        Write-Host "`n⏳ Aguardando 3 segundos..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

# ===== RESUMO DOS RESULTADOS =====
Write-Host "`n📊 RESUMO DOS RESULTADOS" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

$passedTests = ($results | Where-Object { $_.Success }).Count
$totalTests = $results.Count
$requiredTests = ($results | Where-Object { $_.Required }).Count
$passedRequired = ($results | Where-Object { $_.Required -and $_.Success }).Count

Write-Host "Testes Passados: $passedTests/$totalTests" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })
Write-Host "Testes Obrigatórios Passados: $passedRequired/$requiredTests" -ForegroundColor $(if ($passedRequired -eq $requiredTests) { "Green" } else { "Red" })

Write-Host "`nDetalhes:" -ForegroundColor White
foreach ($result in $results) {
    $status = if ($result.Success) { "✅" } else { "❌" }
    $type = if ($result.Required) { "(OBRIGATÓRIO)" } else { "(OPCIONAL)" }
    Write-Host "$status $($result.Name) $type" -ForegroundColor $(if ($result.Success) { "Green" } else { "Red" })
}

# ===== VERIFICAÇÃO FINAL =====
Write-Host "`n🎯 VERIFICAÇÃO FINAL" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($passedRequired -eq $requiredTests) {
    Write-Host "✅ SUCESSO: Todos os testes obrigatórios passaram!" -ForegroundColor Green
    Write-Host "🎉 O sistema EnvioHolerites está funcionando corretamente!" -ForegroundColor Green
} else {
    Write-Host "❌ FALHA: Alguns testes obrigatórios falharam!" -ForegroundColor Red
    Write-Host "🔧 Verifique os erros acima e corrija os problemas." -ForegroundColor Yellow
}

# ===== TESTE MANUAL =====
if (-not $SkipManual) {
    Write-Host "`n🎯 TESTE MANUAL" -ForegroundColor Cyan
    Write-Host "===============" -ForegroundColor Cyan
    
    Write-Host "Para completar a verificação, execute os seguintes testes manuais:" -ForegroundColor White
    
    Write-Host "`n1. 📝 CADASTRO DE FUNCIONÁRIO:" -ForegroundColor White
    Write-Host "   - Acesse: $BaseUrl/envio-holerites" -ForegroundColor Gray
    Write-Host "   - Clique em 'Novo Funcionário'" -ForegroundColor Gray
    Write-Host "   - Preencha os dados e salve" -ForegroundColor Gray
    
    Write-Host "`n2. 📤 ENVIO DE HOLERITE:" -ForegroundColor White
    Write-Host "   - Selecione um funcionário" -ForegroundColor Gray
    Write-Host "   - Clique em 'Enviar Holerite'" -ForegroundColor Gray
    Write-Host "   - Escolha Email ou WhatsApp" -ForegroundColor Gray
    Write-Host "   - Confirme o envio" -ForegroundColor Gray
    
    Write-Host "`n3. 📱 VERIFICAÇÃO WHATSAPP:" -ForegroundColor White
    Write-Host "   - Verifique se o WPPConnect está rodando" -ForegroundColor Gray
    Write-Host "   - Confirme se o WhatsApp está conectado" -ForegroundColor Gray
    Write-Host "   - Teste o envio de uma mensagem" -ForegroundColor Gray
    
    Write-Host "`n4. 🎨 TESTE DE RESPONSIVIDADE:" -ForegroundColor White
    Write-Host "   - Abra DevTools (F12)" -ForegroundColor Gray
    Write-Host "   - Teste diferentes resoluções" -ForegroundColor Gray
    Write-Host "   - Verifique se os elementos se adaptam" -ForegroundColor Gray
    
    $openBrowser = Read-Host "`nDeseja abrir o navegador para teste manual? (s/n)"
    if ($openBrowser -eq 's' -or $openBrowser -eq 'S') {
        try {
            Start-Process "$BaseUrl/envio-holerites"
            Write-Host "✅ Navegador aberto" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Erro ao abrir navegador" -ForegroundColor Red
        }
    }
}

# ===== PRÓXIMOS PASSOS =====
Write-Host "`n🚀 PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

if ($passedRequired -eq $requiredTests) {
    Write-Host "✅ Sistema pronto para uso!" -ForegroundColor Green
    Write-Host "📋 Próximas ações recomendadas:" -ForegroundColor White
    
    $nextSteps = @(
        "Implementar testes automatizados com Jest",
        "Adicionar filtros avançados",
        "Criar dashboard de métricas",
        "Implementar logs de auditoria",
        "Configurar monitoramento",
        "Otimizar performance",
        "Implementar cache",
        "Adicionar relatórios"
    )
    
    foreach ($step in $nextSteps) {
        Write-Host "   • $step" -ForegroundColor Gray
    }
} else {
    Write-Host "🔧 Ações necessárias:" -ForegroundColor Yellow
    
    $failedTests = $results | Where-Object { $_.Required -and -not $_.Success }
    foreach ($test in $failedTests) {
        Write-Host "   • Corrigir: $($test.Name)" -ForegroundColor Red
    }
    
    Write-Host "`n💡 Dicas para correção:" -ForegroundColor White
    Write-Host "   • Verifique se os serviços estão rodando" -ForegroundColor Gray
    Write-Host "   • Confirme as configurações de URL" -ForegroundColor Gray
    Write-Host "   • Verifique os logs de erro" -ForegroundColor Gray
    Write-Host "   • Teste manualmente cada funcionalidade" -ForegroundColor Gray
}

# ===== RELATÓRIO FINAL =====
Write-Host "`n📋 RELATÓRIO FINAL" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
Write-Host "Data/Hora: $timestamp" -ForegroundColor Gray
Write-Host "URL Frontend: $BaseUrl" -ForegroundColor Gray
Write-Host "URL Backend: $BackendUrl" -ForegroundColor Gray
Write-Host "Status Geral: $(if ($passedRequired -eq $requiredTests) { 'APROVADO' } else { 'REPROVADO' })" -ForegroundColor $(if ($passedRequired -eq $requiredTests) { "Green" } else { "Red" })

Write-Host "`n✅ Execução de todos os testes concluída!" -ForegroundColor Green 