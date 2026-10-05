# Script para verificar por que o GitHub Actions não executou
Write-Host "🔍 Verificando configuração do GitHub Actions..." -ForegroundColor Cyan
Write-Host ""

cd c:\dev\fluxbus

# 1. Verificar branch atual
Write-Host "1️⃣ Verificando branch atual..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "   Branch: $branch" -ForegroundColor $(if ($branch -eq "ci") { "Green" } else { "Red" })
if ($branch -ne "ci") {
    Write-Host "   ⚠️ Você não está na branch 'ci'!" -ForegroundColor Red
    Write-Host "   Execute: git checkout ci" -ForegroundColor Yellow
}
Write-Host ""

# 2. Verificar se o workflow existe
Write-Host "2️⃣ Verificando se o workflow existe..." -ForegroundColor Yellow
$workflowPath = ".github\workflows\deploy-ci-docker.yml"
if (Test-Path $workflowPath) {
    Write-Host "   ✅ Workflow encontrado: $workflowPath" -ForegroundColor Green
    
    # Verificar conteúdo do workflow
    $workflowContent = Get-Content $workflowPath -Raw
    if ($workflowContent -match "branches:\s*-\s*ci") {
        Write-Host "   ✅ Workflow configurado para branch 'ci'" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Workflow NÃO está configurado para branch 'ci'!" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Workflow NÃO encontrado em $workflowPath" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar último commit
Write-Host "3️⃣ Verificando último commit..." -ForegroundColor Yellow
$lastCommit = git log -1 --pretty=format:"%h - %s (%ar)"
Write-Host "   Último commit: $lastCommit" -ForegroundColor Cyan
Write-Host ""

# 4. Verificar se há commits não enviados
Write-Host "4️⃣ Verificando commits não enviados..." -ForegroundColor Yellow
$unpushed = git log origin/ci..HEAD --oneline 2>$null
if ($unpushed) {
    Write-Host "   ⚠️ Há commits locais não enviados:" -ForegroundColor Yellow
    $unpushed | ForEach-Object { Write-Host "      $_" -ForegroundColor Cyan }
    Write-Host "   Execute: git push origin ci" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Todos os commits foram enviados" -ForegroundColor Green
}
Write-Host ""

# 5. Verificar remote
Write-Host "5️⃣ Verificando remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "   Remote: $remote" -ForegroundColor Cyan
    if ($remote -match "github\.com") {
        Write-Host "   ✅ Remote aponta para GitHub" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Remote não parece ser GitHub" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Remote 'origin' não configurado!" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar status do repositório
Write-Host "6️⃣ Verificando status do repositório..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   ⚠️ Há alterações não commitadas:" -ForegroundColor Yellow
    Write-Host $status
    Write-Host "   Execute: git add -A && git commit -m 'mensagem'" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Nenhuma alteração pendente" -ForegroundColor Green
}
Write-Host ""

# 7. Verificar se o arquivo do workflow está no caminho correto
Write-Host "7️⃣ Verificando estrutura do workflow..." -ForegroundColor Yellow
$workflowDir = ".github\workflows"
if (Test-Path $workflowDir) {
    $workflows = Get-ChildItem $workflowDir -Filter "*.yml" -Recurse
    Write-Host "   Workflows encontrados:" -ForegroundColor Cyan
    $workflows | ForEach-Object { Write-Host "      $($_.Name)" -ForegroundColor Cyan }
} else {
    Write-Host "   ❌ Diretório .github\workflows não existe!" -ForegroundColor Red
}
Write-Host ""

# 8. Resumo e recomendações
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 RESUMO E RECOMENDAÇÕES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($branch -ne "ci") {
    Write-Host "❌ PROBLEMA: Você não está na branch 'ci'" -ForegroundColor Red
    Write-Host "   SOLUÇÃO: git checkout ci" -ForegroundColor Yellow
    Write-Host ""
}

if ($unpushed) {
    Write-Host "❌ PROBLEMA: Há commits não enviados" -ForegroundColor Red
    Write-Host "   SOLUÇÃO: git push origin ci" -ForegroundColor Yellow
    Write-Host ""
}

if ($status) {
    Write-Host "⚠️ AVISO: Há alterações não commitadas" -ForegroundColor Yellow
    Write-Host "   SOLUÇÃO: git add -A && git commit -m 'mensagem' && git push origin ci" -ForegroundColor Yellow
    Write-Host ""
}

if ($branch -eq "ci" -and -not $unpushed -and -not $status) {
    Write-Host "✅ Tudo parece estar correto!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Se o GitHub Actions ainda não executou, verifique:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://github.com/[seu-usuario]/fluxbus/actions" -ForegroundColor Cyan
    Write-Host "   2. Verifique se o workflow está habilitado" -ForegroundColor Cyan
    Write-Host "   3. Verifique se há erros de sintaxe no arquivo .yml" -ForegroundColor Cyan
    Write-Host "   4. Tente executar manualmente: Actions > Run workflow" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "🔗 Links úteis:" -ForegroundColor Cyan
Write-Host "   - GitHub Actions: https://github.com/[seu-usuario]/fluxbus/actions" -ForegroundColor Cyan
Write-Host "   - Workflow: .github/workflows/deploy-ci-docker.yml" -ForegroundColor Cyan
Write-Host ""
