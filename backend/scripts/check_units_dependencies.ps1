# Script para verificar dependências de todas as unidades
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

Write-Host "=== Verificação de Dependências de Unidades ===" -ForegroundColor Green
Write-Host ""

# Buscar todas as unidades
try {
    $units = Invoke-RestMethod -Uri "$baseUrl/api/units" -Headers $headers -Method Get
    
    Write-Host "Total de unidades encontradas: $($units.Count)" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($unit in $units) {
        Write-Host "Verificando: $($unit.name) (ID: $($unit.id))" -ForegroundColor Yellow
        
        try {
            $checkResponse = Invoke-RestMethod -Uri "$baseUrl/api/units/$($unit.id)/can-delete" -Headers $headers -Method Get
            
            if ($checkResponse.canDelete) {
                Write-Host "  ✅ Pode excluir normalmente" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Precisa exclusão em cascata" -ForegroundColor Red
                Write-Host "  Dependências:" -ForegroundColor Yellow
                
                foreach ($dep in $checkResponse.dependencies.PSObject.Properties) {
                    if ($dep.Value -gt 0) {
                        Write-Host "    - $($dep.Name): $($dep.Value)" -ForegroundColor Red
                    }
                }
            }
            
        } catch {
            Write-Host "  Erro ao verificar: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
    }
    
    Write-Host "=== Resumo ===" -ForegroundColor Green
    $canDelete = ($units | ForEach-Object { 
        try { 
            $check = Invoke-RestMethod -Uri "$baseUrl/api/units/$($_.id)/can-delete" -Headers $headers -Method Get
            return $check.canDelete 
        } catch { return $false }
    } | Where-Object { $_ -eq $true }).Count
    
    $needCascade = $units.Count - $canDelete
    
    Write-Host "Unidades que podem ser excluídas normalmente: $canDelete" -ForegroundColor Green
    Write-Host "Unidades que precisam exclusão em cascata: $needCascade" -ForegroundColor Red
    
    if ($needCascade -gt 0) {
        Write-Host ""
        Write-Host "💡 Para testar a exclusão em cascata, tente excluir uma das unidades com dependências!" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "Erro ao buscar unidades: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verificação Concluída ===" -ForegroundColor Green 