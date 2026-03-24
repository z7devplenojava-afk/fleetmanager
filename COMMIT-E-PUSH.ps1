# =====================================================
# SCRIPT PARA COMMIT E PUSH - EXECUTAR MANUALMENTE
# =====================================================

# Adicionar Git ao PATH
$env:PATH = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;$env:PATH"

# Mudar para o diretório do projeto
Set-Location "c:\dev\secured-guard"

# Caminho completo do Git
$git = "C:\Program Files\Git\bin\git.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMMIT E PUSH - SECURED GUARD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar branch
Write-Host "1️⃣ Verificando branch..." -ForegroundColor Yellow
$branch = & $git branch --show-current
Write-Host "   Branch: $branch" -ForegroundColor White
Write-Host ""

# 2. Verificar status
Write-Host "2️⃣ Verificando alterações..." -ForegroundColor Yellow
$status = & $git status --porcelain
if ($status) {
    Write-Host "   Alterações encontradas:" -ForegroundColor Green
    $status | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
} else {
    Write-Host "   Nenhuma alteração encontrada." -ForegroundColor Yellow
}
Write-Host ""

# 3. Adicionar arquivos
Write-Host "3️⃣ Adicionando arquivos ao staging..." -ForegroundColor Yellow
& $git add -A
Write-Host "   ✅ Arquivos adicionados!" -ForegroundColor Green
Write-Host ""

# 4. Verificar o que foi adicionado
Write-Host "4️⃣ Arquivos no staging:" -ForegroundColor Yellow
$staged = & $git diff --cached --name-only
if ($staged) {
    $staged | ForEach-Object { Write-Host "   + $_" -ForegroundColor Green }
} else {
    Write-Host "   Nenhum arquivo no staging." -ForegroundColor Yellow
}
Write-Host ""

# 5. Fazer commit
Write-Host "5️⃣ Fazendo commit..." -ForegroundColor Yellow
$commitMsg = "feat: adicionar seed automático de banco de dados para ambiente CI"
& $git commit -m $commitMsg

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Commit realizado com sucesso!" -ForegroundColor Green
    
    # Mostrar último commit
    $lastCommit = & $git log -1 --oneline
    Write-Host "   Commit: $lastCommit" -ForegroundColor White
    Write-Host ""
    
    # 6. Fazer push
    Write-Host "6️⃣ Fazendo push para origin/$branch..." -ForegroundColor Yellow
    & $git push origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Push realizado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Deploy automático será iniciado!" -ForegroundColor Cyan
        Write-Host "🔍 Acompanhe: https://github.com/zemarioramos/secured-guard/actions" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Erro ao fazer push!" -ForegroundColor Red
        Write-Host "   Código: $LASTEXITCODE" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Erro ao fazer commit!" -ForegroundColor Red
    Write-Host "   Código: $LASTEXITCODE" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Manter janela aberta
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
