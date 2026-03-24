# Script para testar endpoints melhorados de unidades
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

Write-Host "=== Teste de Endpoints Melhorados de Unidades ===" -ForegroundColor Green
Write-Host ""

# Função para testar listagem com filtros
function Test-ListUnits {
    param($filter, $value, $description)
    
    Write-Host "Testando listagem: $description" -ForegroundColor Yellow
    
    try {
        $uri = "$baseUrl/api/units"
        if ($filter -and $value) {
            $uri += "?$filter=$value"
        }
        
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
        
        Write-Host "  Unidades encontradas: $($response.Count)" -ForegroundColor Cyan
        if ($response.Count -gt 0) {
            Write-Host "  Primeira unidade: $($response[0].name)" -ForegroundColor Green
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

# Função para testar atualização
function Test-UpdateUnit {
    param($unitId, $unitName)
    
    Write-Host "Testando atualização: $unitName" -ForegroundColor Yellow
    
    try {
        $updateData = @{
            name = "$unitName - Atualizada"
            address = "Endereço Atualizado, 999"
            phone = "(11) 88888-7777"
            email = "atualizada@empresa.com"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/units/$unitId" -Headers $headers -Method Put -Body $updateData
        
        Write-Host "  Unidade atualizada: $($response.name)" -ForegroundColor Green
        Write-Host "  Novo endereço: $($response.address)" -ForegroundColor Cyan
        
    } catch {
        Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "  Status Code: $statusCode" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# Testar diferentes tipos de listagem
Test-ListUnits -description "Todas as unidades"
Test-ListUnits -filter "name" -value "Centro" -description "Filtrar por nome (Centro)"
Test-ListUnits -filter "email" -value "contato" -description "Filtrar por email (contato)"
Test-ListUnits -filter "phone" -value "11" -description "Filtrar por telefone (11)"
Test-ListUnits -filter "rootOnly" -value "true" -description "Apenas unidades raiz"

# Testar atualização de uma unidade específica
$testUnitId = "00000000-0000-0000-0000-000000000001"
Test-UpdateUnit -unitId $testUnitId -unitName "Matriz"

Write-Host "=== Teste Concluído ===" -ForegroundColor Green 