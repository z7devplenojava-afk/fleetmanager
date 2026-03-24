# Script para testar o cadastro de unidades
$baseUrl = "http://localhost:8081"
$token = Get-Content "token.txt" -ErrorAction SilentlyContinue

if (-not $token) {
    Write-Host "Token não encontrado. Faça login primeiro."
    exit 1
}

# Dados da unidade para teste (formato UnitCreateDTO)
$unitData = @{
    name = "Unidade Teste BH Shopping"
    description = "Unidade operacional no BH Shopping"
    address = "Av. Cristiano Machado, 4000 - Belo Horizonte, MG"
    phone = "(31) 99999-8888"
    email = "bhshopping@teste.com"
    parentId = $null
    clientId = $null
} | ConvertTo-Json

Write-Host "Testando cadastro de unidade..."
Write-Host "Dados: $unitData"

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/units" -Method POST -Body $unitData -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "Unidade criada com sucesso!"
    Write-Host "ID: $($response.id)"
    Write-Host "Nome: $($response.name)"
    Write-Host "Endereço: $($response.address)"
    Write-Host "Telefone: $($response.phone)"
    Write-Host "Email: $($response.email)"
    
} catch {
    Write-Host "Erro ao criar unidade:"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    Write-Host "Mensagem: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta: $responseBody"
    }
} 