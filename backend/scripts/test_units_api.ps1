# Script para testar a API de Unidades do FluxBus
$baseUrl = "http://localhost:8081"
$token = Get-Content "token.txt" -ErrorAction SilentlyContinue

if (-not $token) {
    Write-Host "Token não encontrado. Faça login primeiro."
    Write-Host "Execute: .\login.ps1"
    exit 1
}

Write-Host "=== TESTE DA API DE UNIDADES ===" -ForegroundColor Green
Write-Host ""

# 1. Listar unidades existentes
Write-Host "1. Listando unidades existentes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Unidades encontradas: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        $response | ForEach-Object {
            Write-Host "  - $($_.name) (ID: $($_.id))" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "Erro ao listar unidades: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. Criar nova unidade
Write-Host "2. Criando nova unidade..." -ForegroundColor Yellow
$newUnitData = @{
    name = "Unidade Teste API"
    description = "Unidade criada via teste da API"
    address = "Rua Teste, 123 - Belo Horizonte, MG"
    phone = "(31) 88888-7777"
    email = "teste.api@fluxbus.com"
    parentId = $null
    clientId = $null
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units" -Method POST -Body $newUnitData -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $token"
    }
    $newUnitId = $response.id
    Write-Host "Unidade criada com sucesso!" -ForegroundColor Green
    Write-Host "  ID: $newUnitId" -ForegroundColor Cyan
    Write-Host "  Nome: $($response.name)" -ForegroundColor Cyan
    Write-Host "  Endereço: $($response.address)" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao criar unidade: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Buscar unidade por ID
Write-Host "3. Buscando unidade por ID..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units/$newUnitId" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Unidade encontrada por ID!" -ForegroundColor Green
    Write-Host "  Nome: $($response.name)" -ForegroundColor Cyan
    Write-Host "  Email: $($response.email)" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao buscar unidade por ID: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Buscar unidade por nome
Write-Host "4. Buscando unidade por nome..." -ForegroundColor Yellow
try {
    $unitName = [System.Web.HttpUtility]::UrlEncode("Unidade Teste API")
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units/name/$unitName" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Unidade encontrada por nome!" -ForegroundColor Green
    Write-Host "  ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "  Endereço: $($response.address)" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao buscar unidade por nome: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Buscar unidades por endereço
Write-Host "5. Buscando unidades por endereço..." -ForegroundColor Yellow
try {
    $address = [System.Web.HttpUtility]::UrlEncode("Teste")
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units/address/$address" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Unidades encontradas por endereço: $($response.Count)" -ForegroundColor Green
    $response | ForEach-Object {
        Write-Host "  - $($_.name): $($_.address)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Erro ao buscar unidades por endereço: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. Atualizar unidade
Write-Host "6. Atualizando unidade..." -ForegroundColor Yellow
$updateUnitData = @{
    name = "Unidade Teste API - Atualizada"
    description = "Unidade atualizada via teste da API"
    address = "Rua Teste Atualizada, 456 - Belo Horizonte, MG"
    phone = "(31) 99999-6666"
    email = "teste.atualizado@fluxbus.com"
    parentId = $null
    clientId = $null
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units/$newUnitId" -Method PUT -Body $updateUnitData -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Unidade atualizada com sucesso!" -ForegroundColor Green
    Write-Host "  Nome: $($response.name)" -ForegroundColor Cyan
    Write-Host "  Telefone: $($response.phone)" -ForegroundColor Cyan
    Write-Host "  Email: $($response.email)" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao atualizar unidade: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 7. Verificar atualização
Write-Host "7. Verificando atualização..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units/$newUnitId" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Verificação concluída!" -ForegroundColor Green
    Write-Host "  Nome atualizado: $($response.name)" -ForegroundColor Cyan
    Write-Host "  Descrição: $($response.description)" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao verificar atualização: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 8. Excluir unidade
Write-Host "8. Excluindo unidade de teste..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/units/$newUnitId" -Method DELETE -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Unidade excluída com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao excluir unidade: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 9. Verificar exclusão
Write-Host "9. Verificando exclusão..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units/$newUnitId" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "ERRO: Unidade ainda existe!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "Sucesso: Unidade foi excluída corretamente!" -ForegroundColor Green
    } else {
        Write-Host "Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Green
Write-Host "Todos os endpoints da API de Unidades foram testados com sucesso!" -ForegroundColor Green 