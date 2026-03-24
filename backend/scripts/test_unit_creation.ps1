# Script para testar criação de unidades e verificar emails
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

Write-Host "=== Teste de Criação de Unidades ===" -ForegroundColor Green
Write-Host ""

# Função para listar unidades existentes
function Get-ExistingUnits {
    try {
        $units = Invoke-RestMethod -Uri "$baseUrl/api/units" -Headers $headers -Method Get
        return $units
    } catch {
        Write-Host "Erro ao buscar unidades: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

# Função para testar criação de unidade
function Test-CreateUnit {
    param($unitData, $description)
    
    Write-Host "Testando: $description" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/units" -Headers $headers -Method Post -Body ($unitData | ConvertTo-Json)
        
        Write-Host "  ✅ Unidade criada com sucesso!" -ForegroundColor Green
        Write-Host "  ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "  Nome: $($response.name)" -ForegroundColor Cyan
        Write-Host "  Email: $($response.email)" -ForegroundColor Cyan
        
    } catch {
        Write-Host "  ❌ Erro ao criar unidade" -ForegroundColor Red
        Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $errorJson = $errorBody | ConvertFrom-Json
                Write-Host "  Mensagem: $($errorJson.message)" -ForegroundColor Red
            } catch {
                Write-Host "  Resposta: $errorBody" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
}

# Listar unidades existentes
Write-Host "📋 Unidades existentes:" -ForegroundColor Cyan
$existingUnits = Get-ExistingUnits

if ($existingUnits.Count -gt 0) {
    foreach ($unit in $existingUnits) {
        Write-Host "  - $($unit.name) (Email: $($unit.email))" -ForegroundColor Gray
    }
} else {
    Write-Host "  Nenhuma unidade encontrada" -ForegroundColor Gray
}

Write-Host ""

# Testar criação com email duplicado
$duplicateEmailData = @{
    name = "Base Uberlândia"
    description = "Unidade da cidade de Uberlândia"
    address = "Rua do Cliente, 123 - Uberlândia, MG"
    phone = "(34) 99999-8888"
    email = "bhshopping@teste.com"  # Email que já existe
}

Test-CreateUnit -unitData $duplicateEmailData -description "Criação com email duplicado"

# Testar criação com email único
$uniqueEmailData = @{
    name = "Base Uberlândia"
    description = "Unidade da cidade de Uberlândia"
    address = "Rua do Cliente, 123 - Uberlândia, MG"
    phone = "(34) 99999-8888"
    email = "uberlandia@teste.com"  # Email único
}

Test-CreateUnit -unitData $uniqueEmailData -description "Criação com email único"

# Testar criação sem email
$noEmailData = @{
    name = "Base Sem Email"
    description = "Unidade sem email"
    address = "Rua Sem Email, 456 - Cidade, UF"
    phone = "(11) 88888-7777"
}

Test-CreateUnit -unitData $noEmailData -description "Criação sem email"

Write-Host "=== Teste Concluído ===" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Dicas para o frontend:" -ForegroundColor Cyan
Write-Host "1. Verifique emails duplicados antes de enviar" -ForegroundColor Yellow
Write-Host "2. Mostre mensagens específicas de erro do backend" -ForegroundColor Yellow
Write-Host "3. Valide campos obrigatórios no frontend" -ForegroundColor Yellow 