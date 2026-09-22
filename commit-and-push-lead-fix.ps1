# Script para fazer commit e push das correcoes do Lead
Write-Host "Preparando commit e push..." -ForegroundColor Cyan

# Verificar se estamos no diretorio correto
if (-not (Test-Path ".git")) {
    Write-Host "Erro: Nao e um repositorio Git!" -ForegroundColor Red
    exit 1
}

# Adicionar arquivos modificados
Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
git add backend/src/main/java/com/z7design/fluxbus/controller/LeadController.java
git add backend/src/main/java/com/z7design/fluxbus/service/LeadService.java
git add frontend/package-lock.json
git add frontend/package.json

# Verificar se ha mudancas
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "Nenhuma mudanca para commitar." -ForegroundColor Yellow
    exit 0
}

# Fazer commit
Write-Host "Fazendo commit..." -ForegroundColor Yellow
$commitMessage = "fix: Corrigir criacao de Lead e atualizar browserslist`n`nCORRECOES:`n- LeadController: Obter usuario atual do SecurityContext em vez de UUID aleatorio`n- LeadService: Mapear description para notes corretamente`n- LeadService: Buscar usuario por username ou email`n- Frontend: Atualizar browserslist e caniuse-lite`n`nPROBLEMA RESOLVIDO:`n- Erro 'Usuario nao encontrado' ao criar Lead (RESOLVIDO)`n- Erro 'setDescription is undefined' (RESOLVIDO)`n- Aviso browserslist desatualizado (RESOLVIDO)"

git commit -m $commitMessage

# Fazer push
Write-Host "Fazendo push..." -ForegroundColor Yellow
git push origin ci

Write-Host "Commit e push concluidos!" -ForegroundColor Green
