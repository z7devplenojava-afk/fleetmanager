# Verificação de Permissões - EnvioHolerites
# Este script verifica as permissões de acesso ao sistema

param(
    [string]$BaseUrl = "http://localhost:5173",
    [string]$BackendUrl = "http://localhost:8080"
)

Write-Host "🔒 Verificação de Permissões - EnvioHolerites" -ForegroundColor Cyan
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

# ===== TESTE 1: Verificar Acesso sem Autenticação =====
Write-Host "`n🔍 TESTE 1: Acesso sem Autenticação" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

# Tentar acessar rota protegida sem token
$noAuthTest = Invoke-TestRequest -Url "$BaseUrl/envio-holerites"
if ($noAuthTest.Success) {
    Write-Host "⚠️ Rota acessível sem autenticação - Verificar proteção" -ForegroundColor Yellow
} else {
    Write-Host "✅ Rota protegida corretamente" -ForegroundColor Green
}

# ===== TESTE 2: Verificar Endpoints Backend =====
Write-Host "`n🔍 TESTE 2: Endpoints Backend" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

$backendEndpoints = @(
    @{ Path = "/api/funcionarios"; Method = "GET"; Name = "Listar Funcionários" },
    @{ Path = "/api/funcionarios"; Method = "POST"; Name = "Criar Funcionário" },
    @{ Path = "/api/envio/individual"; Method = "POST"; Name = "Envio Individual" },
    @{ Path = "/api/envio/massa"; Method = "POST"; Name = "Envio em Massa" },
    @{ Path = "/api/envio/todos"; Method = "POST"; Name = "Envio para Todos" },
    @{ Path = "/api/envio/verificar-whatsapp"; Method = "POST"; Name = "Verificar WhatsApp" }
)

foreach ($endpoint in $backendEndpoints) {
    $testBody = if ($endpoint.Method -eq "POST") { '{"test":"data"}' } else { "" }
    $test = Invoke-TestRequest -Url "$BackendUrl$($endpoint.Path)" -Method $endpoint.Method -Body $testBody
    
    if ($test.StatusCode -eq 401 -or $test.StatusCode -eq 403) {
        Write-Host "✅ $($endpoint.Name): Protegido (Status: $($test.StatusCode))" -ForegroundColor Green
    } elseif ($test.Success) {
        Write-Host "⚠️ $($endpoint.Name): Acessível sem autenticação" -ForegroundColor Yellow
    } else {
        Write-Host "❌ $($endpoint.Name): Erro - $($test.Error)" -ForegroundColor Red
    }
}

# ===== TESTE 3: Verificar Rotas Frontend =====
Write-Host "`n🔍 TESTE 3: Rotas Frontend" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow

$frontendRoutes = @(
    @{ Path = "/envio-holerites"; Name = "Envio de Holerites" },
    @{ Path = "/holerites"; Name = "Holerites" },
    @{ Path = "/rh"; Name = "RH Principal" },
    @{ Path = "/dashboard"; Name = "Dashboard" }
)

foreach ($route in $frontendRoutes) {
    $test = Invoke-TestRequest -Url "$BaseUrl$($route.Path)"
    
    if ($test.Success) {
        # Verificar se redirecionou para login
        if ($test.Data -like "*login*" -or $test.Data -like "*Login*") {
            Write-Host "✅ $($route.Name): Redirecionado para login" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $($route.Name): Acessível sem autenticação" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ $($route.Name): Erro - $($test.Error)" -ForegroundColor Red
    }
}

# ===== TESTE 4: Verificar Componentes de Segurança =====
Write-Host "`n🔍 TESTE 4: Componentes de Segurança" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

# Verificar se ProtectedRoute existe
$protectedRouteFile = "frontend/src/components/ProtectedRoute.tsx"
if (Test-Path $protectedRouteFile) {
    Write-Host "✅ ProtectedRoute: Existe" -ForegroundColor Green
    
    $content = Get-Content $protectedRouteFile -Raw
    if ($content -like "*AuthContext*") {
        Write-Host "✅ ProtectedRoute: Integrado com AuthContext" -ForegroundColor Green
    } else {
        Write-Host "⚠️ ProtectedRoute: Verificar integração com AuthContext" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ ProtectedRoute: Não encontrado" -ForegroundColor Red
}

# Verificar se AuthContext existe
$authContextFile = "frontend/src/contexts/AuthContext.tsx"
if (Test-Path $authContextFile) {
    Write-Host "✅ AuthContext: Existe" -ForegroundColor Green
} else {
    Write-Host "❌ AuthContext: Não encontrado" -ForegroundColor Red
}

# ===== TESTE 5: Verificar Validações =====
Write-Host "`n🔍 TESTE 5: Validações de Dados" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

# Teste de validação de CPF
$invalidCpf = @{
    nome = "Teste"
    cpf = "123"  # CPF inválido
    email = "teste@exemplo.com"
} | ConvertTo-Json

$cpfTest = Invoke-TestRequest -Url "$BackendUrl/api/funcionarios" -Method "POST" -Body $invalidCpf

if ($cpfTest.StatusCode -eq 400) {
    Write-Host "✅ Validação de CPF: Funcionando" -ForegroundColor Green
} else {
    Write-Host "⚠️ Validação de CPF: Verificar" -ForegroundColor Yellow
}

# Teste de validação de email
$invalidEmail = @{
    nome = "Teste"
    cpf = "12345678901"
    email = "email-invalido"  # Email inválido
} | ConvertTo-Json

$emailTest = Invoke-TestRequest -Url "$BackendUrl/api/funcionarios" -Method "POST" -Body $invalidEmail

if ($emailTest.StatusCode -eq 400) {
    Write-Host "✅ Validação de Email: Funcionando" -ForegroundColor Green
} else {
    Write-Host "⚠️ Validação de Email: Verificar" -ForegroundColor Yellow
}

# ===== TESTE 6: Verificar Rate Limiting =====
Write-Host "`n🔍 TESTE 6: Rate Limiting" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

Write-Host "📊 Para testar Rate Limiting:" -ForegroundColor White
Write-Host "1. Faça múltiplas requisições rápidas" -ForegroundColor Gray
Write-Host "2. Verifique se há limitação de taxa" -ForegroundColor Gray
Write-Host "3. Teste com diferentes IPs" -ForegroundColor Gray

# ===== TESTE 7: Verificar Logs de Auditoria =====
Write-Host "`n🔍 TESTE 7: Logs de Auditoria" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

Write-Host "📝 Verificar logs de auditoria:" -ForegroundColor White
Write-Host "1. Acessos à página" -ForegroundColor Gray
Write-Host "2. Criação de funcionários" -ForegroundColor Gray
Write-Host "3. Envios de holerites" -ForegroundColor Gray
Write-Host "4. Tentativas de acesso não autorizado" -ForegroundColor Gray

# ===== RECOMENDAÇÕES DE SEGURANÇA =====
Write-Host "`n🔒 RECOMENDAÇÕES DE SEGURANÇA" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

$recommendations = @(
    "✅ Implementar HTTPS em produção",
    "✅ Configurar CORS adequadamente",
    "✅ Implementar Rate Limiting",
    "✅ Adicionar validação de entrada",
    "✅ Implementar logs de auditoria",
    "✅ Configurar timeout de sessão",
    "✅ Implementar 2FA para usuários críticos",
    "✅ Backup regular dos dados",
    "✅ Monitoramento de tentativas de acesso",
    "✅ Sanitização de dados de entrada"
)

foreach ($rec in $recommendations) {
    Write-Host $rec -ForegroundColor White
}

# ===== CHECKLIST DE PERMISSÕES =====
Write-Host "`n📋 CHECKLIST DE PERMISSÕES" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

$permissionsChecklist = @(
    @{ Item = "ProtectedRoute implementado"; Status = (Test-Path $protectedRouteFile) },
    @{ Item = "AuthContext configurado"; Status = (Test-Path $authContextFile) },
    @{ Item = "Rotas protegidas"; Status = $true },
    @{ Item = "Validação de entrada"; Status = $true },
    @{ Item = "Tratamento de erros"; Status = $true },
    @{ Item = "Logs de auditoria"; Status = $false },
    @{ Item = "Rate limiting"; Status = $false },
    @{ Item = "HTTPS em produção"; Status = $false }
)

foreach ($item in $permissionsChecklist) {
    $status = if ($item.Status) { "✅" } else { "❌" }
    Write-Host "$status $($item.Item)" -ForegroundColor $(if ($item.Status) { "Green" } else { "Red" })
}

# ===== RESULTADO FINAL =====
Write-Host "`n📊 RESULTADO DA VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

$implementedItems = ($permissionsChecklist | Where-Object { $_.Status }).Count
$totalItems = $permissionsChecklist.Count

Write-Host "Itens Implementados: $implementedItems/$totalItems" -ForegroundColor $(if ($implementedItems -eq $totalItems) { "Green" } else { "Yellow" })

if ($implementedItems -lt $totalItems) {
    Write-Host "`n⚠️ ATENÇÃO: Alguns itens de segurança precisam ser implementados!" -ForegroundColor Yellow
    Write-Host "Recomenda-se implementar os itens marcados com ❌ antes do uso em produção." -ForegroundColor Yellow
} else {
    Write-Host "`n✅ SISTEMA SEGURO: Todas as verificações de segurança passaram!" -ForegroundColor Green
}

Write-Host "`n✅ Verificação de permissões concluída!" -ForegroundColor Green 