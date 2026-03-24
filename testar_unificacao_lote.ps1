# Script para testar unificação em lote
# Este script cria documentos unificados em lote para o mês de setembro/2025

$baseUrl = "http://localhost:8081"

Write-Host "🔍 Testando unificação em lote de documentos..." -ForegroundColor Cyan
Write-Host ""

# Testar criação em lote para setembro/2025
$month = 9
$year = 2025

Write-Host "📅 Criando unificação em lote para: $month/$year" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/unified-documents/batch-create?month=$month&year=$year" -Method POST
    
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Resposta recebida:" -ForegroundColor Green
    Write-Host ($content | ConvertTo-Json -Depth 10)
    
    if ($content.sucesso) {
        Write-Host ""
        Write-Host "🎉 Unificação em lote criada com sucesso!" -ForegroundColor Green
        Write-Host "📊 Total de documentos criados: $($content.totalCreated)" -ForegroundColor Cyan
        Write-Host "❌ Falhas: $($content.totalFailed)" -ForegroundColor Red
    } else {
        Write-Host "❌ Erro: $($content.mensagem)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "💥 Erro ao fazer requisição: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Listando documentos unificados..." -ForegroundColor Cyan

try {
    $listResponse = Invoke-WebRequest -Uri "$baseUrl/api/unified-documents/public/list-detailed" -Method GET
    
    $listContent = $listResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Lista recebida:" -ForegroundColor Green
    Write-Host "Total: $($listContent.total)" -ForegroundColor Cyan
    Write-Host "Individuais: $($listContent.individualCount)" -ForegroundColor Green
    Write-Host "Em Lote: $($listContent.batchCount)" -ForegroundColor Magenta
    Write-Host "Desconhecidos: $($listContent.unknownCount)" -ForegroundColor Yellow
    
    if ($listContent.documents.Count -gt 0) {
        Write-Host ""
        Write-Host "📄 Primeiros 5 documentos:" -ForegroundColor Cyan
        $listContent.documents | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $($_.employeeName) | $($_.month)/$($_.year) | $($_.unificationTypeLabel)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "💥 Erro ao listar documentos: $_" -ForegroundColor Red
}

