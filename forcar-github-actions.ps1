# Script para forçar execução do GitHub Actions
Write-Host "🚀 Forçando execução do GitHub Actions..." -ForegroundColor Cyan
Write-Host ""

cd c:\dev\secured-guard

# 1. Verificar e fazer checkout da branch ci
Write-Host "1️⃣ Verificando branch..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "   Branch atual: $branch" -ForegroundColor Cyan

if ($branch -ne "ci") {
    Write-Host "   ⚠️ Não está na branch 'ci'. Fazendo checkout..." -ForegroundColor Yellow
    git checkout ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erro ao fazer checkout da branch ci!" -ForegroundColor Red
        Write-Host "   Execute manualmente: git checkout ci" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "   ✅ Agora está na branch 'ci'" -ForegroundColor Green
} else {
    Write-Host "   ✅ Já está na branch 'ci'" -ForegroundColor Green
}
Write-Host ""

# 2. Verificar se há alterações não commitadas
Write-Host "2️⃣ Verificando alterações..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   📝 Há alterações não commitadas. Adicionando..." -ForegroundColor Yellow
    git add -A
    git commit -m "chore: alterações pendentes"
    Write-Host "   ✅ Alterações commitadas" -ForegroundColor Green
} else {
    Write-Host "   ✅ Nenhuma alteração pendente" -ForegroundColor Green
}
Write-Host ""

# 3. Fazer commit vazio para forçar trigger
Write-Host "3️⃣ Criando commit vazio para forçar GitHub Actions..." -ForegroundColor Yellow
git commit --allow-empty -m "chore: trigger GitHub Actions deploy CI"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Commit vazio criado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Não foi possível criar commit vazio (pode já estar atualizado)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Fazer push
Write-Host "4️⃣ Fazendo push para origin/ci..." -ForegroundColor Yellow
git push origin ci
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ GitHub Actions deve ser executado agora!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Verifique o status em:" -ForegroundColor Cyan
    Write-Host "   https://github.com/[seu-usuario]/secured-guard/actions" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "   ❌ Erro ao fazer push!" -ForegroundColor Red
    Write-Host "   Verifique sua conexão e credenciais Git" -ForegroundColor Yellow
    Write-Host ""
}

# 5. Verificar status final
Write-Host "5️⃣ Status final:" -ForegroundColor Yellow
git status --short
Write-Host ""
