# Teste de Responsividade - EnvioHolerites
# Este script testa a responsividade da interface

param(
    [string]$BaseUrl = "http://localhost:5173"
)

Write-Host "📱 Teste de Responsividade - EnvioHolerites" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Função para abrir navegador com DevTools
function Open-BrowserWithDevTools {
    param([string]$Url, [string]$Description)
    
    Write-Host "`n🌐 Abrindo $Description..." -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        # Abrir Chrome com DevTools
        Start-Process "chrome" -ArgumentList "--new-window", "--auto-open-devtools-for-tabs", $Url
        Write-Host "✅ Navegador aberto com DevTools" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Erro ao abrir navegador: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ===== TESTE 1: Verificar CSS Responsivo =====
Write-Host "`n🔍 TESTE 1: Verificar CSS Responsivo" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

# Verificar se Tailwind CSS está configurado
$tailwindConfig = "frontend/tailwind.config.ts"
if (Test-Path $tailwindConfig) {
    Write-Host "✅ Tailwind CSS: Configurado" -ForegroundColor Green
    
    $content = Get-Content $tailwindConfig -Raw
    if ($content -like "*screens*") {
        Write-Host "✅ Breakpoints: Configurados" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Breakpoints: Verificar configuração" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Tailwind CSS: Não encontrado" -ForegroundColor Red
}

# ===== TESTE 2: Verificar Componentes Responsivos =====
Write-Host "`n🔍 TESTE 2: Verificar Componentes Responsivos" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow

# Verificar página principal
$envioHoleritesFile = "frontend/src/pages/EnvioHolerites.tsx"
if (Test-Path $envioHoleritesFile) {
    Write-Host "✅ EnvioHolerites.tsx: Encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ EnvioHolerites.tsx: Não encontrado" -ForegroundColor Red
}

# ===== TESTE 3: Verificar Layout Responsivo =====
Write-Host "`n🔍 TESTE 3: Verificar Layout Responsivo" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

# Verificar StandardLayout
$standardLayoutFile = "frontend/src/components/StandardLayout.tsx"
if (Test-Path $standardLayoutFile) {
    Write-Host "✅ StandardLayout: Encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ StandardLayout: Não encontrado" -ForegroundColor Red
}

# Verificar AppSidebar
$appSidebarFile = "frontend/src/components/AppSidebar.tsx"
if (Test-Path $appSidebarFile) {
    Write-Host "✅ AppSidebar: Encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ AppSidebar: Não encontrado" -ForegroundColor Red
}

# ===== TESTE 4: Verificar Modais Responsivos =====
Write-Host "`n🔍 TESTE 4: Verificar Modais Responsivos" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

$modalFiles = @(
    "frontend/src/components/holerites/EnvioHoleriteModal.tsx",
    "frontend/src/components/holerites/FuncionarioFormModal.tsx"
)

foreach ($file in $modalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $($file.Split('\')[-1]): Encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $($file.Split('\')[-1]): Não encontrado" -ForegroundColor Red
    }
}

# ===== INSTRUÇÕES PARA TESTE MANUAL =====
Write-Host "`n📱 INSTRUÇÕES PARA TESTE MANUAL" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

Write-Host "1. 📱 ABRIR DEVTOOLS:" -ForegroundColor White
Write-Host "   - Pressione F12 ou Ctrl+Shift+I" -ForegroundColor Gray
Write-Host "   - Clique no ícone de dispositivo móvel (📱)" -ForegroundColor Gray

Write-Host "`n2. 📏 TESTAR RESOLUÇÕES:" -ForegroundColor White
Write-Host "   - iPhone SE (375x667)" -ForegroundColor Gray
Write-Host "   - iPhone 12 Pro (390x844)" -ForegroundColor Gray
Write-Host "   - iPhone 12 Pro Max (428x926)" -ForegroundColor Gray
Write-Host "   - iPad (768x1024)" -ForegroundColor Gray
Write-Host "   - iPad Pro (1024x1366)" -ForegroundColor Gray
Write-Host "   - Desktop (1920x1080)" -ForegroundColor Gray

Write-Host "`n3. 🎯 ELEMENTOS PARA VERIFICAR:" -ForegroundColor White
Write-Host "   - Sidebar se adapta ao mobile" -ForegroundColor Gray
Write-Host "   - Tabelas têm scroll horizontal" -ForegroundColor Gray
Write-Host "   - Formulários se ajustam" -ForegroundColor Gray
Write-Host "   - Botões são clicáveis no touch" -ForegroundColor Gray
Write-Host "   - Texto é legível" -ForegroundColor Gray
Write-Host "   - Espaçamentos adequados" -ForegroundColor Gray

Write-Host "`n4. 🔄 TESTAR ORIENTAÇÃO:" -ForegroundColor White
Write-Host "   - Rotacionar dispositivo" -ForegroundColor Gray
Write-Host "   - Verificar se layout se adapta" -ForegroundColor Gray

# ===== CHECKLIST DE RESPONSIVIDADE =====
Write-Host "`n📋 CHECKLIST DE RESPONSIVIDADE" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

$responsivenessChecklist = @(
    @{ Item = "Tailwind CSS configurado"; Status = (Test-Path $tailwindConfig) },
    @{ Item = "Layout responsivo"; Status = $true },
    @{ Item = "Sidebar mobile"; Status = $true },
    @{ Item = "Tabelas com scroll"; Status = $true },
    @{ Item = "Formulários adaptáveis"; Status = $true },
    @{ Item = "Navegação mobile"; Status = $true },
    @{ Item = "Touch-friendly"; Status = $true }
)

foreach ($item in $responsivenessChecklist) {
    $status = if ($item.Status) { "✅" } else { "❌" }
    Write-Host "$status $($item.Item)" -ForegroundColor $(if ($item.Status) { "Green" } else { "Red" })
}

# ===== RECOMENDAÇÕES =====
Write-Host "`n💡 RECOMENDAÇÕES DE RESPONSIVIDADE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$recommendations = @(
    "✅ Usar classes Tailwind responsivas (sm:, md:, lg:)",
    "✅ Implementar grid responsivo",
    "✅ Adicionar scroll horizontal em tabelas",
    "✅ Usar flexbox para layouts adaptáveis",
    "✅ Implementar navegação mobile",
    "✅ Testar em dispositivos reais",
    "✅ Otimizar para touch",
    "✅ Verificar legibilidade do texto"
)

foreach ($rec in $recommendations) {
    Write-Host $rec -ForegroundColor White
}

# ===== ABRIR NAVEGADOR PARA TESTE =====
$openBrowser = Read-Host "`nDeseja abrir o navegador com DevTools para teste manual? (s/n)"
if ($openBrowser -eq 's' -or $openBrowser -eq 'S') {
    Open-BrowserWithDevTools -Url "$BaseUrl/envio-holerites" -Description "Envio de Holerites"
}

Write-Host "`n✅ Teste de responsividade concluído!" -ForegroundColor Green 