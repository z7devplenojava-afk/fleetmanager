# Script para testar o fluxo completo do frontend
# Autor: Assistant
# Data: 2025-06-25

# Configurações
$baseUrl = "http://localhost:8081"
$tokenFile = "token.txt"

# Verificar se o token existe
if (-not (Test-Path $tokenFile)) {
    Write-Host "Token não encontrado. Execute primeiro o script de login." -ForegroundColor Red
    exit 1
}

# Ler token
$token = Get-Content $tokenFile -Raw
$token = $token.Trim()

# Headers
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== Teste do Fluxo Completo do Frontend ===" -ForegroundColor Green
Write-Host ""

# Função para simular o fluxo do frontend
function Test-FrontendFlow {
    param($unitId, $unitName)
    
    Write-Host "Testando fluxo para: $unitName (ID: $unitId)" -ForegroundColor Yellow
    Write-Host ""
    
    # Passo 1: Usuário clica no botão de exclusão
    Write-Host "1️⃣ Usuário clica no botão de exclusão" -ForegroundColor Cyan
    
    # Passo 2: Frontend chama checkDeletePossibility
    Write-Host "2️⃣ Frontend chama /api/units/$unitId/can-delete" -ForegroundColor Cyan
    
    try {
        $checkResponse = Invoke-RestMethod -Uri "$baseUrl/api/units/$unitId/can-delete" -Headers $headers -Method Get
        
        Write-Host "   Resposta da API:" -ForegroundColor Gray
        Write-Host "   - canDelete: $($checkResponse.canDelete)" -ForegroundColor $(if ($checkResponse.canDelete) { "Green" } else { "Red" })
        Write-Host "   - unitName: $($checkResponse.unitName)" -ForegroundColor Gray
        
        if ($checkResponse.dependencies -and $checkResponse.dependencies.PSObject.Properties.Count -gt 0) {
            Write-Host "   - Dependências:" -ForegroundColor Yellow
            foreach ($dep in $checkResponse.dependencies.PSObject.Properties) {
                if ($dep.Value -gt 0) {
                    Write-Host "     * $($dep.Name): $($dep.Value)" -ForegroundColor Red
                }
            }
        }
        
        # Passo 3: Frontend decide qual dialog mostrar
        Write-Host ""
        Write-Host "3️⃣ Frontend decide qual dialog mostrar:" -ForegroundColor Cyan
        
        if ($checkResponse.canDelete) {
            Write-Host "   ✅ Dialog: 'Confirmar exclusão'" -ForegroundColor Green
            Write-Host "   ✅ Botão: 'Excluir' (vermelho)" -ForegroundColor Green
            Write-Host "   ✅ Ação: Exclusão normal" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Dialog: 'Não é possível excluir'" -ForegroundColor Red
            Write-Host "   ❌ Lista: Dependências encontradas" -ForegroundColor Red
            Write-Host "   🟠 Botão: 'Excluir com Dependências' (laranja)" -ForegroundColor Orange
            Write-Host "   🟠 Ação: Exclusão em cascata" -ForegroundColor Orange
        }
        
        # Passo 4: Se usuário confirma exclusão em cascata
        if (-not $checkResponse.canDelete) {
            Write-Host ""
            Write-Host "4️⃣ Usuário confirma exclusão em cascata" -ForegroundColor Cyan
            Write-Host "   Frontend chama /api/units/$unitId/with-dependencies" -ForegroundColor Gray
            
            try {
                $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/units/$unitId/with-dependencies" -Headers $headers -Method Delete
                Write-Host "   ✅ Exclusão em cascata realizada com sucesso!" -ForegroundColor Green
            } catch {
                Write-Host "   ❌ Erro na exclusão em cascata: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
    } catch {
        Write-Host "   ❌ Erro ao verificar dependências: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
}

# Testar com a unidade que tem dependências
$testUnit = @{ Id = "00000000-0000-0000-0000-000000000005"; Name = "Matriz" }

Test-FrontendFlow -unitId $testUnit.Id -unitName $testUnit.Name

Write-Host "=== Teste Concluído ===" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Agora teste no frontend:" -ForegroundColor Cyan
Write-Host "1. Acesse http://localhost:8080/filiais" -ForegroundColor Yellow
Write-Host "2. Clique no ícone de lixeira da unidade 'Matriz'" -ForegroundColor Yellow
Write-Host "3. Deve aparecer o dialog com dependências" -ForegroundColor Yellow
Write-Host "4. Clique em 'Excluir com Dependências'" -ForegroundColor Yellow 