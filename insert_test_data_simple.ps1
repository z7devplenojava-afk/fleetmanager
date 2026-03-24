Write-Host "=== INSERINDO DADOS DE TESTE ===" -ForegroundColor Green

$env:PGPASSWORD = "postgres"

try {
    $result = psql -h localhost -p 5432 -U postgres -d secured_guard -f "backend/src/main/resources/db/migration/insert_test_data_simple.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dados inseridos com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao inserir dados" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "=== FIM ===" -ForegroundColor Green
