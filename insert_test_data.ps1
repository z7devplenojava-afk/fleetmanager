# Script para inserir dados de teste no banco de dados
# Executa o SQL de dados de teste para popular os dropdowns

Write-Host "=== INSERINDO DADOS DE TESTE NO BANCO ===" -ForegroundColor Green

# Configurações do banco
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "secured_guard"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"

# Caminho para o arquivo SQL
$SQL_FILE = "backend/src/main/resources/db/migration/insert_test_data_simple.sql"

try {
    Write-Host "📁 Executando arquivo: $SQL_FILE" -ForegroundColor Yellow
    
    # Verificar se o arquivo existe
    if (-not (Test-Path $SQL_FILE)) {
        Write-Host "❌ Arquivo SQL não encontrado: $SQL_FILE" -ForegroundColor Red
        exit 1
    }
    
    # Executar o comando psql
    $env:PGPASSWORD = $DB_PASSWORD
    $command = "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f `"$SQL_FILE`""
    
    Write-Host "🔧 Executando comando: $command" -ForegroundColor Cyan
    
    Invoke-Expression $command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dados de teste inseridos com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Dados inseridos:" -ForegroundColor Yellow
        Write-Host "   • 1 Cliente: Cliente Teste" -ForegroundColor White
        Write-Host "   • 2 Funcionários: João Silva, Maria Santos" -ForegroundColor White
        Write-Host "   • 1 Posto: Posto Teste A" -ForegroundColor White
        Write-Host "   • 1 Unidade: Unidade Teste" -ForegroundColor White
        Write-Host "   • 2 Posições: Vigilante, Supervisor" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 Agora os dropdowns devem carregar dados reais!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao executar SQL. Código de saída: $LASTEXITCODE" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro ao executar script: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpar variável de ambiente
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== FIM DO SCRIPT ===" -ForegroundColor Green
