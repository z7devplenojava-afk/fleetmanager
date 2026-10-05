# Script para importar funcionários para o SecureGuard
Write-Host "🚀 IMPORTANDO FUNCIONÁRIOS PARA FLUXBUS" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Verificar se o arquivo JSON existe
$jsonPath = "funcionarios_importacao.json"
if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ Arquivo funcionarios_importacao.json não encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: .\import_planilha_simples.ps1" -ForegroundColor Yellow
    exit 1
}

# Ler dados do JSON
$jsonData = Get-Content $jsonPath | ConvertFrom-Json
Write-Host "📊 Importando $($jsonData.total) funcionários..." -ForegroundColor Yellow

# URL da API
$apiUrl = "http://localhost:8080/api/employees"

$sucessos = 0
$falhas = 0

foreach ($func in $jsonData.funcionarios) {
    try {
        $payload = @{
            name = $func.nome
            document = $func.cpf
            phone = $func.telefone
            email = $func.email
            possuiWhatsapp = $func.possuiWhatsapp
        } | ConvertTo-Json

        $headers = @{
            "Content-Type" = "application/json"
        }

        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $payload -Headers $headers

        Write-Host "✅ Importado: $($func.nome) - $($func.cpf)" -ForegroundColor Green
        $sucessos++
    } catch {
        Write-Host "❌ Erro ao importar $($func.nome): $($_.Exception.Message)" -ForegroundColor Red
        $falhas++
    }
}

Write-Host "`n📊 RESUMO DA IMPORTAÇÃO:" -ForegroundColor Cyan
Write-Host "✅ Sucessos: $sucessos" -ForegroundColor Green
Write-Host "❌ Falhas: $falhas" -ForegroundColor Red
Write-Host "📊 Total: $($jsonData.total)" -ForegroundColor Yellow

Write-Host "`n🎉 IMPORTAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "Agora você pode enviar holerites via WhatsApp!" -ForegroundColor Cyan 