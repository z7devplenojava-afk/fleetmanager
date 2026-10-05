# Script para fazer commit e push das alterações
# Usa o Git do caminho correto

# Adicionar Git ao PATH
$env:PATH = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;$env:PATH"

Write-Host "🔄 Verificando status do Git..." -ForegroundColor Cyan
cd c:\dev\fluxbus

# Verificar se Git está disponível
try {
    $gitVersion = & "C:\Program Files\Git\bin\git.exe" --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não encontrado em C:\Program Files\Git\bin\git.exe" -ForegroundColor Red
    exit 1
}

# Usar o caminho completo do Git
$gitCmd = "C:\Program Files\Git\bin\git.exe"

# Verificar branch atual
$branch = & $gitCmd branch --show-current
Write-Host "📍 Branch atual: $branch" -ForegroundColor Yellow

# Verificar status
Write-Host "`n📋 Verificando alterações..." -ForegroundColor Cyan
$status = & $gitCmd status --porcelain

if ($status) {
    Write-Host "📝 Alterações encontradas:" -ForegroundColor Green
    Write-Host $status
    
    # Adicionar todas as alterações
    Write-Host "`n➕ Adicionando alterações ao staging..." -ForegroundColor Cyan
    & $gitCmd add -A
    
    # Verificar o que foi adicionado
    Write-Host "`n📋 Arquivos no staging:" -ForegroundColor Cyan
    & $gitCmd status --short
    
    # Fazer commit
    Write-Host "`n💾 Fazendo commit..." -ForegroundColor Cyan
    $commitMessage = @"
feat: adicionar seed automático de banco de dados para ambiente CI

- Criar migration Flyway V999 com dados essenciais (usuário admin, unidades, turnos, cargos, departamento, cliente)
- Criar CIDataLoader para popular EPIs automaticamente no ambiente CI
- Adicionar documentação completa do sistema de seed e troubleshooting GitHub Actions
- Seed executa automaticamente durante deploy via Flyway e CommandLineRunner
"@
    
    & $gitCmd commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
        
        # Verificar último commit
        Write-Host "`n📝 Último commit:" -ForegroundColor Cyan
        & $gitCmd log -1 --oneline
        
        # Fazer push
        Write-Host "`n📤 Fazendo push para origin/$branch..." -ForegroundColor Cyan
        & $gitCmd push origin $branch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Push realizado com sucesso!" -ForegroundColor Green
            Write-Host "🚀 Deploy automático será iniciado em breve!" -ForegroundColor Cyan
            Write-Host "`n🔍 Acompanhe em: https://github.com/zemarioramos/fluxbus/actions" -ForegroundColor Yellow
        } else {
            Write-Host "`n❌ Erro ao fazer push!" -ForegroundColor Red
            Write-Host "Código de saída: $LASTEXITCODE" -ForegroundColor Red
        }
    } else {
        Write-Host "`n❌ Erro ao fazer commit!" -ForegroundColor Red
        Write-Host "Código de saída: $LASTEXITCODE" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ Nenhuma alteração para commitar." -ForegroundColor Yellow
    
    # Verificar se há commits não enviados
    $unpushed = & $gitCmd log origin/$branch..HEAD --oneline
    if ($unpushed) {
        Write-Host "`n📤 Há commits não enviados. Fazendo push..." -ForegroundColor Cyan
        & $gitCmd push origin $branch
        
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
& $gitCmd status --short
