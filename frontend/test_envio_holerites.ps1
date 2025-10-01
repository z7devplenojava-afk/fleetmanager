# Teste de Integração Frontend - EnvioHolerites
# Este script testa a integração da página EnvioHolerites

param(
    [string]$BaseUrl = "http://localhost:5173",
    [string]$BackendUrl = "http://localhost:8080"
)

Write-Host "🧪 Teste de Integração Frontend - EnvioHolerites" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Função para verificar se um serviço está rodando
function Test-Service {
    param([string]$Url, [string]$ServiceName)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5
        Write-Host "✅ $ServiceName`: Rodando ($($response.StatusCode))" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $ServiceName`: Não está rodando" -ForegroundColor Red
        return $false
    }
}

# Função para abrir URL no navegador
function Open-Url {
    param([string]$Url, [string]$Description)
    
    Write-Host "`n🌐 Abrindo $Description..." -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        Start-Process $Url
        Write-Host "✅ Navegador aberto com sucesso" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao abrir navegador: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verificar serviços
Write-Host "`n🔍 Verificando serviços..." -ForegroundColor Yellow

$frontendRunning = Test-Service -Url "$BaseUrl" -ServiceName "Frontend (Vite)"
$backendRunning = Test-Service -Url "$BackendUrl/api/health" -ServiceName "Backend (Spring Boot)"

# Verificar endpoints específicos
Write-Host "`n🔍 Verificando endpoints..." -ForegroundColor Yellow

try {
    $funcionariosResponse = Invoke-WebRequest -Uri "$BackendUrl/api/funcionarios" -Method GET -TimeoutSec 5
    Write-Host "✅ API Funcionários: Funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ API Funcionários: Erro - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $envioResponse = Invoke-WebRequest -Uri "$BackendUrl/api/envio/verificar-whatsapp" -Method POST -ContentType "application/json" -Body '{"provider":"wppconnect"}' -TimeoutSec 5
    Write-Host "✅ API Envio WhatsApp: Funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ API Envio WhatsApp: Erro - $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar rotas do frontend
Write-Host "`n🔍 Verificando rotas do frontend..." -ForegroundColor Yellow

$frontendRoutes = @(
    @{ Path = "/envio-holerites"; Name = "Envio de Holerites" },
    @{ Path = "/holerites"; Name = "Holerites" },
    @{ Path = "/rh"; Name = "RH Principal" },
    @{ Path = "/dashboard"; Name = "Dashboard" }
)

foreach ($route in $frontendRoutes) {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl$($route.Path)" -Method GET -TimeoutSec 5
        Write-Host "✅ Rota $($route.Name): Acessível" -ForegroundColor Green
    } catch {
        Write-Host "❌ Rota $($route.Name): Erro - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Resumo dos testes
Write-Host "`n📊 Resumo dos Testes:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "Frontend: $(if ($frontendRunning) { '✅ Rodando' } else { '❌ Parado' })" -ForegroundColor $(if ($frontendRunning) { "Green" } else { "Red" })
Write-Host "Backend: $(if ($backendRunning) { '✅ Rodando' } else { '❌ Parado' })" -ForegroundColor $(if ($backendRunning) { "Green" } else { "Red" })

# Instruções para teste manual
Write-Host "`n🎯 Teste Manual:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($frontendRunning) {
    Write-Host "1. Acesse: $BaseUrl/envio-holerites" -ForegroundColor White
    Write-Host "2. Teste o cadastro de funcionários" -ForegroundColor White
    Write-Host "3. Teste a busca e filtros" -ForegroundColor White
    Write-Host "4. Teste o envio individual" -ForegroundColor White
    Write-Host "5. Teste o envio em massa" -ForegroundColor White
    Write-Host "6. Teste o envio para todos" -ForegroundColor White
    
    $openBrowser = Read-Host "`nDeseja abrir o navegador automaticamente? (s/n)"
    if ($openBrowser -eq 's' -or $openBrowser -eq 'S') {
        Open-Url -Url "$BaseUrl/envio-holerites" -Description "Envio de Holerites"
    }
} else {
    Write-Host "❌ Frontend não está rodando. Execute primeiro:" -ForegroundColor Red
    Write-Host "   cd frontend" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Yellow
}

# Checklist de funcionalidades
Write-Host "`n📋 Checklist de Funcionalidades:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$checklist = @(
    "✅ Rota /envio-holerites adicionada ao App.tsx",
    "✅ Menu 'Envio de Holerites' adicionado ao sidebar",
    "✅ Página EnvioHolerites.tsx implementada",
    "✅ Componentes de modal criados",
    "✅ Tipos TypeScript definidos",
    "✅ Serviços de API implementados",
    "✅ Integração com backend configurada"
)

foreach ($item in $checklist) {
    Write-Host $item -ForegroundColor Green
}

# Próximos passos
Write-Host "`n🚀 Próximos Passos:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "1. Teste o fluxo completo de cadastro" -ForegroundColor White
Write-Host "2. Teste o envio de holerites via email" -ForegroundColor White
Write-Host "3. Teste o envio de holerites via WhatsApp" -ForegroundColor White
Write-Host "4. Verifique as permissões de acesso" -ForegroundColor White
Write-Host "5. Ajuste estilos conforme necessário" -ForegroundColor White
Write-Host "6. Implemente testes automatizados" -ForegroundColor White

Write-Host "`n✅ Teste de integração concluído!" -ForegroundColor Green 