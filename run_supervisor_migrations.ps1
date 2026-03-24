# Script para executar migrações de supervisores
Write-Host "Executando migrações para funcionalidade de Supervisores..." -ForegroundColor Green

# Definir variáveis
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$host = "localhost"
$port = "5432"
$database = "secured_guard"
$username = "postgres"
$password = "postgres"

# Verificar se psql existe
if (-not (Test-Path $psqlPath)) {
    Write-Host "psql não encontrado em $psqlPath. Tentando usar psql do PATH..." -ForegroundColor Yellow
    $psqlPath = "psql"
}

# Definir variável de ambiente para senha
$env:PGPASSWORD = $password

try {
    # Executar migração da tabela supervisors
    Write-Host "Criando tabela supervisors..." -ForegroundColor Cyan
    & $psqlPath -h $host -p $port -U $username -d $database -f "backend/src/main/resources/db/migration/create_supervisors_table.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tabela supervisors criada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao criar tabela supervisors" -ForegroundColor Red
        exit 1
    }
    
    # Executar migração da tabela user_terms_consent
    Write-Host "Criando tabela user_terms_consent..." -ForegroundColor Cyan
    & $psqlPath -h $host -p $port -U $username -d $database -f "backend/src/main/resources/db/migration/create_user_terms_consent_table.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tabela user_terms_consent criada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao criar tabela user_terms_consent" -ForegroundColor Red
        exit 1
    }
    
    # Inserir dados de teste
    Write-Host "Inserindo dados de teste..." -ForegroundColor Cyan
    & $psqlPath -h $host -p $port -U $username -d $database -f "backend/src/main/resources/db/migration/insert_test_supervisors.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dados de teste inseridos com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Aviso: Erro ao inserir dados de teste (pode ser normal se já existirem)" -ForegroundColor Yellow
    }
    
    Write-Host "🎉 Migrações executadas com sucesso!" -ForegroundColor Green
    Write-Host "As seguintes tabelas foram criadas:" -ForegroundColor White
    Write-Host "- supervisors (com índices e triggers)" -ForegroundColor Gray
    Write-Host "- user_terms_consent (com índices)" -ForegroundColor Gray
    Write-Host "- Dados de teste inseridos" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Erro durante execução das migrações: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Limpar variável de ambiente
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
