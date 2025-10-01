# Teste de Fluxo Completo - EnvioHolerites
# Este script testa todo o fluxo: cadastro → envio → verificação

param(
    [string]$BaseUrl = "http://localhost:5173",
    [string]$BackendUrl = "http://localhost:8080",
    [string]$TestEmail = "teste@exemplo.com",
    [string]$TestPhone = "5511999999999"
)

Write-Host "🧪 Teste de Fluxo Completo - EnvioHolerites" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Função para fazer requisições HTTP
function Invoke-TestRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = "",
        [hashtable]$Headers = @{}
    )
    
    try {
        $headers["Content-Type"] = "application/json"
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $Body -Headers $Headers -TimeoutSec 10
        }
        
        return @{ Success = $true; Data = $response; StatusCode = 200 }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $_.Exception.Response.StatusCode.value__ }
    }
}

# Função para abrir navegador
function Open-Browser {
    param([string]$Url, [string]$Description)
    
    Write-Host "`n🌐 Abrindo $Description..." -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        Start-Process $Url
        Write-Host "✅ Navegador aberto" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Erro ao abrir navegador: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ===== TESTE 1: Verificar Serviços =====
Write-Host "`n🔍 TESTE 1: Verificando Serviços" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# Verificar Frontend
$frontendTest = Invoke-TestRequest -Url $BaseUrl
if ($frontendTest.Success) {
    Write-Host "✅ Frontend: Rodando" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: Erro - $($frontendTest.Error)" -ForegroundColor Red
}

# Verificar Backend
$backendTest = Invoke-TestRequest -Url "$BackendUrl/api/health"
if ($backendTest.Success) {
    Write-Host "✅ Backend: Rodando" -ForegroundColor Green
} else {
    Write-Host "❌ Backend: Erro - $($backendTest.Error)" -ForegroundColor Red
}

# ===== TESTE 2: Verificar APIs =====
Write-Host "`n🔍 TESTE 2: Verificando APIs" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

# API Funcionários
$funcionariosTest = Invoke-TestRequest -Url "$BackendUrl/api/funcionarios"
if ($funcionariosTest.Success) {
    Write-Host "✅ API Funcionários: Funcionando" -ForegroundColor Green
} else {
    Write-Host "❌ API Funcionários: Erro - $($funcionariosTest.Error)" -ForegroundColor Red
}

# API WhatsApp
$whatsappTest = Invoke-TestRequest -Url "$BackendUrl/api/envio/verificar-whatsapp" -Method "POST" -Body '{"provider":"wppconnect"}'
if ($whatsappTest.Success) {
    Write-Host "✅ API WhatsApp: Funcionando" -ForegroundColor Green
} else {
    Write-Host "❌ API WhatsApp: Erro - $($whatsappTest.Error)" -ForegroundColor Red
}

# ===== TESTE 3: Verificar Rotas Frontend =====
Write-Host "`n🔍 TESTE 3: Verificando Rotas Frontend" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$routes = @(
    @{ Path = "/envio-holerites"; Name = "Envio de Holerites" },
    @{ Path = "/holerites"; Name = "Holerites" },
    @{ Path = "/rh"; Name = "RH Principal" },
    @{ Path = "/dashboard"; Name = "Dashboard" }
)

foreach ($route in $routes) {
    $routeTest = Invoke-TestRequest -Url "$BaseUrl$($route.Path)"
    if ($routeTest.Success) {
        Write-Host "✅ Rota $($route.Name): Acessível" -ForegroundColor Green
    } else {
        Write-Host "❌ Rota $($route.Name): Erro - $($routeTest.Error)" -ForegroundColor Red
    }
}

# ===== TESTE 4: Teste de Cadastro de Funcionário =====
Write-Host "`n🔍 TESTE 4: Teste de Cadastro de Funcionário" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow

$novoFuncionario = @{
    nome = "João Silva Teste"
    cpf = "12345678901"
    email = $TestEmail
    telefone = $TestPhone
    possuiWhatsapp = $true
} | ConvertTo-Json

$cadastroTest = Invoke-TestRequest -Url "$BackendUrl/api/funcionarios" -Method "POST" -Body $novoFuncionario

if ($cadastroTest.Success) {
    Write-Host "✅ Cadastro de Funcionário: Sucesso" -ForegroundColor Green
    $funcionarioId = $cadastroTest.Data.id
    Write-Host "   ID do funcionário: $funcionarioId" -ForegroundColor Gray
} else {
    Write-Host "❌ Cadastro de Funcionário: Erro - $($cadastroTest.Error)" -ForegroundColor Red
    $funcionarioId = $null
}

# ===== TESTE 5: Teste de Envio de Holerite =====
Write-Host "`n🔍 TESTE 5: Teste de Envio de Holerite" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

if ($funcionarioId) {
    # Teste de envio individual
    $envioIndividual = @{
        funcionarioId = $funcionarioId
        tipo = "whatsapp"
        mensagem = "Teste de envio de holerite via WhatsApp"
    } | ConvertTo-Json

    $envioTest = Invoke-TestRequest -Url "$BackendUrl/api/envio/individual" -Method "POST" -Body $envioIndividual

    if ($envioTest.Success) {
        Write-Host "✅ Envio Individual: Sucesso" -ForegroundColor Green
        Write-Host "   Total enviados: $($envioTest.Data.totalEnviados)" -ForegroundColor Gray
        Write-Host "   Total falhas: $($envioTest.Data.totalFalhas)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Envio Individual: Erro - $($envioTest.Error)" -ForegroundColor Red
    }

    # Teste de envio em massa
    $envioMassa = @{
        funcionarioIds = @($funcionarioId)
        tipo = "email"
        assunto = "Holerite - Teste"
        mensagem = "Teste de envio de holerite via Email"
    } | ConvertTo-Json

    $massaTest = Invoke-TestRequest -Url "$BackendUrl/api/envio/massa" -Method "POST" -Body $envioMassa

    if ($massaTest.Success) {
        Write-Host "✅ Envio em Massa: Sucesso" -ForegroundColor Green
        Write-Host "   Total enviados: $($massaTest.Data.totalEnviados)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Envio em Massa: Erro - $($massaTest.Error)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Pulando teste de envio - Funcionário não foi criado" -ForegroundColor Yellow
}

# ===== TESTE 6: Verificação de WhatsApp =====
Write-Host "`n🔍 TESTE 6: Verificação de WhatsApp" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

# Verificar WPPConnect
$wppconnectStatus = Invoke-TestRequest -Url "http://localhost:8080/api/status"
if ($wppconnectStatus.Success) {
    Write-Host "✅ WPPConnect: $($wppconnectStatus.Data.status)" -ForegroundColor Green
} else {
    Write-Host "❌ WPPConnect: Não está rodando" -ForegroundColor Red
}

# Verificar Baileys
$baileysStatus = Invoke-TestRequest -Url "http://localhost:3000/status"
if ($baileysStatus.Success) {
    Write-Host "✅ Baileys: $($baileysStatus.Data.connected)" -ForegroundColor Green
} else {
    Write-Host "❌ Baileys: Não está rodando" -ForegroundColor Red
}

# Verificar n8n
$n8nStatus = Invoke-TestRequest -Url "http://localhost:5678/healthz"
if ($n8nStatus.Success) {
    Write-Host "✅ n8n: Rodando" -ForegroundColor Green
} else {
    Write-Host "❌ n8n: Não está rodando" -ForegroundColor Red
}

# ===== TESTE 7: Teste de Responsividade =====
Write-Host "`n🔍 TESTE 7: Teste de Responsividade" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

Write-Host "📱 Para testar responsividade:" -ForegroundColor White
Write-Host "1. Abra o DevTools (F12)" -ForegroundColor Gray
Write-Host "2. Clique no ícone de dispositivo móvel" -ForegroundColor Gray
Write-Host "3. Teste diferentes resoluções:" -ForegroundColor Gray
Write-Host "   - iPhone SE (375x667)" -ForegroundColor Gray
Write-Host "   - iPhone 12 Pro (390x844)" -ForegroundColor Gray
Write-Host "   - iPad (768x1024)" -ForegroundColor Gray
Write-Host "   - Desktop (1920x1080)" -ForegroundColor Gray

# ===== RESULTADO FINAL =====
Write-Host "`n📊 RESULTADO FINAL DOS TESTES" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

$tests = @(
    @{ Name = "Frontend"; Status = $frontendTest.Success },
    @{ Name = "Backend"; Status = $backendTest.Success },
    @{ Name = "API Funcionários"; Status = $funcionariosTest.Success },
    @{ Name = "API WhatsApp"; Status = $whatsappTest.Success },
    @{ Name = "Cadastro Funcionário"; Status = $cadastroTest.Success },
    @{ Name = "Envio Individual"; Status = if ($funcionarioId) { $envioTest.Success } else { $false } },
    @{ Name = "Envio em Massa"; Status = if ($funcionarioId) { $massaTest.Success } else { $false } }
)

$passedTests = ($tests | Where-Object { $_.Status }).Count
$totalTests = $tests.Count

Write-Host "Testes Passados: $passedTests/$totalTests" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

foreach ($test in $tests) {
    $status = if ($test.Status) { "✅" } else { "❌" }
    Write-Host "$status $($test.Name)" -ForegroundColor $(if ($test.Status) { "Green" } else { "Red" })
}

# ===== INSTRUÇÕES PARA TESTE MANUAL =====
Write-Host "`n🎯 TESTE MANUAL COMPLETO" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

Write-Host "1. 📝 CADASTRO DE FUNCIONÁRIO:" -ForegroundColor White
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
Write-Host "   - Teste em diferentes dispositivos" -ForegroundColor Gray
Write-Host "   - Verifique se os elementos se adaptam" -ForegroundColor Gray
Write-Host "   - Teste a navegação no mobile" -ForegroundColor Gray

# Perguntar se quer abrir o navegador
$openBrowser = Read-Host "`nDeseja abrir o navegador para teste manual? (s/n)"
if ($openBrowser -eq 's' -or $openBrowser -eq 'S') {
    Open-Browser -Url "$BaseUrl/envio-holerites" -Description "Envio de Holerites"
}

Write-Host "`n✅ Teste de fluxo completo concluído!" -ForegroundColor Green 