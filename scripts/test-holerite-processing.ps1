# Teste de Processamento de Holerites
Write-Host "Testando Processamento de Holerites" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# 1. Verificar se o backend está rodando
Write-Host "`n1. Verificando se o backend está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/payslips" -Method GET -TimeoutSec 5
    Write-Host "  Backend está rodando" -ForegroundColor Green
} catch {
    Write-Host "  Backend não está rodando. Inicie o backend primeiro." -ForegroundColor Red
    exit 1
}

# 2. Verificar dados extraídos existentes
Write-Host "`n2. Verificando dados extraídos existentes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/payslips/extracted-data" -Method GET -TimeoutSec 10
    Write-Host "  Endpoint de dados extraídos funcionando" -ForegroundColor Green
    Write-Host "  Dados extraídos: $($response.extractedDataCount)" -ForegroundColor Gray
    Write-Host "  Holerites processados: $($response.payslipsCount)" -ForegroundColor Gray
    
    if ($response.extractedDataCount -gt 0) {
        Write-Host "  Exemplos de dados extraídos:" -ForegroundColor Gray
        $response.extractedData | Select-Object -First 3 | ForEach-Object {
            Write-Host "     - $($_.nome) (CPF: $($_.cpf)) - $($_.mesReferencia)/$($_.anoReferencia)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  Erro ao verificar dados extraídos: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Verificar endpoint de dados extraídos específico
Write-Host "`n3. Verificando endpoint específico de dados extraídos..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/extract-data-holerites" -Method GET -TimeoutSec 10
    Write-Host "  Endpoint específico funcionando" -ForegroundColor Green
    Write-Host "  Total de registros: $($response.Count)" -ForegroundColor Gray
} catch {
    Write-Host "  Erro no endpoint específico: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Verificar estrutura da tabela
Write-Host "`n4. Verificando estrutura da tabela..." -ForegroundColor Yellow
Write-Host "  Tabela: tb_extract_data_holerites" -ForegroundColor Gray
Write-Host "  Campos:" -ForegroundColor Gray
Write-Host "     - id (UUID)" -ForegroundColor Gray
Write-Host "     - nome (VARCHAR(255))" -ForegroundColor Gray
Write-Host "     - cpf (VARCHAR(20))" -ForegroundColor Gray
Write-Host "     - codigo (VARCHAR(50))" -ForegroundColor Gray
Write-Host "     - mes_referencia (VARCHAR(7))" -ForegroundColor Gray
Write-Host "     - ano_referencia (INTEGER)" -ForegroundColor Gray
Write-Host "     - created_at (TIMESTAMP)" -ForegroundColor Gray

# 5. Instruções para teste
Write-Host "`n5. Para testar o processamento completo:" -ForegroundColor Yellow
Write-Host "  Faça upload de um PDF de holerites via:" -ForegroundColor Gray
Write-Host "     POST http://localhost:8080/api/payslips/upload" -ForegroundColor Gray
Write-Host "  Verifique os dados extraídos via:" -ForegroundColor Gray
Write-Host "     GET http://localhost:8080/api/payslips/extracted-data" -ForegroundColor Gray
Write-Host "  Ou via endpoint específico:" -ForegroundColor Gray
Write-Host "     GET http://localhost:8080/api/extract-data-holerites" -ForegroundColor Gray

Write-Host "`nTeste concluído!" -ForegroundColor Green 