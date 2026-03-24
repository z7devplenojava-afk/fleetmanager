# Script para cadastrar múltiplas unidades usando dados fake
$baseUrl = "http://localhost:8081"
$token = Get-Content "token.txt" -ErrorAction SilentlyContinue

if (-not $token) {
    Write-Host "Token não encontrado. Faça login primeiro."
    Write-Host "Execute: .\login.ps1"
    exit 1
}

# Dados das unidades para cadastro
$unitsData = @(
    @{
        name = "Unidade BH Shopping"
        description = "Unidade operacional no BH Shopping - Centro de Belo Horizonte"
        address = "Av. Cristiano Machado, 4000 - Belo Horizonte, MG"
        phone = "(31) 99999-8888"
        email = "bhshopping@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Centro"
        description = "Unidade operacional no centro da cidade"
        address = "Rua da Liberdade, 100 - Centro - Belo Horizonte, MG"
        phone = "(31) 88888-7777"
        email = "centro@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Savassi"
        description = "Unidade operacional na região da Savassi"
        address = "Rua Pernambuco, 500 - Savassi - Belo Horizonte, MG"
        phone = "(31) 77777-6666"
        email = "savassi@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Pampulha"
        description = "Unidade operacional na região da Pampulha"
        address = "Av. Antônio Abrahão Caram, 1000 - Pampulha - Belo Horizonte, MG"
        phone = "(31) 66666-5555"
        email = "pampulha@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Barreiro"
        description = "Unidade operacional no Barreiro"
        address = "Rua Padre Pedro Pinto, 200 - Barreiro - Belo Horizonte, MG"
        phone = "(31) 55555-4444"
        email = "barreiro@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Venda Nova"
        description = "Unidade operacional em Venda Nova"
        address = "Av. Venda Nova, 1500 - Venda Nova - Belo Horizonte, MG"
        phone = "(31) 44444-3333"
        email = "vendanova@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Contagem"
        description = "Unidade operacional em Contagem"
        address = "Av. João César de Oliveira, 800 - Contagem, MG"
        phone = "(31) 33333-2222"
        email = "contagem@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Betim"
        description = "Unidade operacional em Betim"
        address = "Rua das Palmeiras, 300 - Betim, MG"
        phone = "(31) 22222-1111"
        email = "betim@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Ribeirão das Neves"
        description = "Unidade operacional em Ribeirão das Neves"
        address = "Av. Principal, 600 - Ribeirão das Neves, MG"
        phone = "(31) 11111-0000"
        email = "ribeirao@securedguard.com"
        parentId = $null
        clientId = $null
    },
    @{
        name = "Unidade Santa Luzia"
        description = "Unidade operacional em Santa Luzia"
        address = "Rua da Paz, 400 - Santa Luzia, MG"
        phone = "(31) 00000-9999"
        email = "santaluzia@securedguard.com"
        parentId = $null
        clientId = $null
    }
)

Write-Host "=== CADASTRO EM LOTE DE UNIDADES ===" -ForegroundColor Green
Write-Host "Total de unidades a cadastrar: $($unitsData.Count)" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$errorCount = 0
$createdUnits = @()

foreach ($unitData in $unitsData) {
    $unitName = $unitData.name
    Write-Host "Cadastrando: $unitName..." -ForegroundColor Cyan
    
    try {
        $jsonData = $unitData | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/units" -Method POST -Body $jsonData -ContentType "application/json" -Headers @{
            "Authorization" = "Bearer $token"
        }
        
        $createdUnits += @{
            id = $response.id
            name = $response.name
            email = $response.email
        }
        
        Write-Host "  ✅ Sucesso! ID: $($response.id)" -ForegroundColor Green
        $successCount++
        
        # Pequena pausa entre as requisições
        Start-Sleep -Milliseconds 200
        
    } catch {
        Write-Host "  ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "=== RESUMO DO CADASTRO ===" -ForegroundColor Green
Write-Host "Sucessos: $successCount" -ForegroundColor Green
Write-Host "Erros: $errorCount" -ForegroundColor Red
Write-Host ""

if ($createdUnits.Count -gt 0) {
    Write-Host "Unidades criadas:" -ForegroundColor Yellow
    $createdUnits | ForEach-Object {
        Write-Host "  - $($_.name) (ID: $($_.id))" -ForegroundColor Cyan
    }
    Write-Host ""
    
    # Salvar IDs das unidades criadas em um arquivo para uso posterior
    $createdUnits | ConvertTo-Json | Out-File -FilePath "created_units.json" -Encoding UTF8
    Write-Host "IDs das unidades salvas em: created_units.json" -ForegroundColor Yellow
}

Write-Host "=== CADASTRO CONCLUÍDO ===" -ForegroundColor Green 