# Script para fazer commit e push das alterações
Write-Host "🔄 Verificando status do Git..." -ForegroundColor Cyan
cd c:\dev\secured-guard

# Verificar branch atual
$branch = git branch --show-current
Write-Host "📍 Branch atual: $branch" -ForegroundColor Yellow

# Verificar se há alterações
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Alterações encontradas:" -ForegroundColor Green
    Write-Host $status
    
    # Adicionar todas as alterações
    Write-Host "`n➕ Adicionando alterações ao staging..." -ForegroundColor Cyan
    git add -A
    
    # Fazer commit
    Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
    git commit -m "feat: corrigir cadastro de treinamento e certificação + documentação deploy automático CI"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
        
        # Fazer push
        Write-Host "`n📤 Fazendo push para origin/$branch..." -ForegroundColor Cyan
        git push origin $branch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Push realizado com sucesso!" -ForegroundColor Green
            Write-Host "🚀 Deploy automático será iniciado em breve!" -ForegroundColor Cyan
        } else {
            Write-Host "`n❌ Erro ao fazer push!" -ForegroundColor Red
        }
    } else {
        Write-Host "`n❌ Erro ao fazer commit!" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ Nenhuma alteração para commitar." -ForegroundColor Yellow
    
    # Verificar se há commits não enviados
    $unpushed = git log origin/$branch..HEAD --oneline
    if ($unpushed) {
        Write-Host "`n📤 Há commits não enviados. Fazendo push..." -ForegroundColor Cyan
        git push origin $branch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ Tudo está sincronizado!" -ForegroundColor Green
    }
}

Write-Host "`n📋 Status final:" -ForegroundColor Cyan
git status --short
