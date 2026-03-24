# Script para testar exclusão em cascata de unidades
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

Write-Host "=== Teste de Exclusão em Cascata de Unidades ===" -ForegroundColor Green
Write-Host ""

# Função para testar exclusão em cascata
function Test-DeleteWithDependencies {
    param($unitId, $unitName)
    
    Write-Host "Testando exclusão em cascata para: $unitName (ID: $unitId)" -ForegroundColor Yellow
    
    try {
        # Primeiro verificar dependências
        Write-Host "  Verificando dependências..." -ForegroundColor Cyan
        $checkResponse = Invoke-RestMethod -Uri "$baseUrl/api/units/$unitId/can-delete" -Headers $headers -Method Get
        
        Write-Host "  Pode excluir normalmente: $($checkResponse.canDelete)" -ForegroundColor $(if ($checkResponse.canDelete) { "Green" } else { "Red" })
        
        if ($checkResponse.dependencies -and $checkResponse.dependencies.PSObject.Properties.Count -gt 0) {
            Write-Host "  Dependências encontradas:" -ForegroundColor Yellow
            foreach ($dep in $checkResponse.dependencies.PSObject.Properties) {
                if ($dep.Value -gt 0) {
                    Write-Host "    - $($dep.Name): $($dep.Value)" -ForegroundColor Red
                }
            }
        }
        
        # Se não pode excluir normalmente, tentar exclusão em cascata
        if (-not $checkResponse.canDelete) {
            Write-Host "  Tentando exclusão em cascata..." -ForegroundColor Orange
            
            $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/units/$unitId/with-dependencies" -Headers $headers -Method Delete
            
            Write-Host "  ✓ Unidade e dependências excluídas com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "  Unidade pode ser excluída normalmente" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "  Status Code: $statusCode" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# IDs de unidades para testar (substitua pelos IDs reais do seu banco)
$testUnits = @(
    @{ Id = "00000000-0000-0000-0000-000000000005"; Name = "Filial 4" }
)

# Testar cada unidade
foreach ($unit in $testUnits) {
    Test-DeleteWithDependencies -unitId $unit.Id -unitName $unit.Name
}

Write-Host "=== Teste Concluído ===" -ForegroundColor Green
Write-Host ""
Write-Host "Nota: A exclusão em cascata remove:" -ForegroundColor Cyan
Write-Host "  - Folhas de pagamento vinculadas" -ForegroundColor Yellow
Write-Host "  - Funcionários vinculados" -ForegroundColor Yellow
Write-Host "  - Cargos vinculados" -ForegroundColor Yellow
Write-Host "  - Localizações vinculadas" -ForegroundColor Yellow
Write-Host "  - Subunidades são movidas para a unidade pai" -ForegroundColor Yellow 