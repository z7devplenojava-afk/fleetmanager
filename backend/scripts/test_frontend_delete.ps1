# Script para testar verificação de exclusão (usado pelo frontend)
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

Write-Host "=== Teste de Verificação de Exclusão (Frontend) ===" -ForegroundColor Green
Write-Host ""

# Função para testar verificação de exclusão
function Test-DeleteCheck {
    param($unitId, $unitName)
    
    Write-Host "Testando verificação de exclusão para: $unitName (ID: $unitId)" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/units/$unitId/can-delete" -Headers $headers -Method Get
        
        Write-Host "  Pode excluir: $($response.canDelete)" -ForegroundColor $(if ($response.canDelete) { "Green" } else { "Red" })
        Write-Host "  Nome da unidade: $($response.unitName)" -ForegroundColor Cyan
        
        if ($response.dependencies -and $response.dependencies.PSObject.Properties.Count -gt 0) {
            Write-Host "  Dependências encontradas:" -ForegroundColor Yellow
            foreach ($dep in $response.dependencies.PSObject.Properties) {
                if ($dep.Value -gt 0) {
                    Write-Host "    - $($dep.Name): $($dep.Value)" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "  Nenhuma dependência encontrada" -ForegroundColor Green
        }
        
        # Se pode excluir, testar a exclusão
        if ($response.canDelete) {
            Write-Host "  Testando exclusão..." -ForegroundColor Yellow
            try {
                Invoke-RestMethod -Uri "$baseUrl/api/units/$unitId" -Headers $headers -Method Delete
                Write-Host "  ✓ Unidade excluída com sucesso" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ Erro ao excluir: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "  ⚠ Não é possível excluir devido às dependências" -ForegroundColor Yellow
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
    @{ Id = "00000000-0000-0000-0000-000000000001"; Name = "Matriz" },
    @{ Id = "00000000-0000-0000-0000-000000000002"; Name = "Filial 1" },
    @{ Id = "00000000-0000-0000-0000-000000000003"; Name = "Filial 2" },
    @{ Id = "00000000-0000-0000-0000-000000000004"; Name = "Filial 3" },
    @{ Id = "00000000-0000-0000-0000-000000000005"; Name = "Filial 4" }
)

# Testar cada unidade
foreach ($unit in $testUnits) {
    Test-DeleteCheck -unitId $unit.Id -unitName $unit.Name
}

Write-Host "=== Teste Concluído ===" -ForegroundColor Green
Write-Host ""
Write-Host "Nota: Este teste simula o comportamento do frontend ao tentar excluir unidades." -ForegroundColor Cyan
Write-Host "O frontend agora verifica as dependências antes de tentar excluir." -ForegroundColor Cyan 