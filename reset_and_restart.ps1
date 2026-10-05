# Script para resetar migrações do Flyway e reiniciar o backend
# Este script executa o reset do banco de dados e reinicia o backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reset de Migrações do Flyway" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o PostgreSQL está rodando
Write-Host "Verificando conexão com o banco de dados..." -ForegroundColor Yellow
$env:PGPASSWORD = "root"

try {
    # Testar conexão
    $testConnection = & psql -U postgres -h localhost -d fluxbus -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Não foi possível conectar ao banco de dados!" -ForegroundColor Red
        Write-Host "Certifique-se de que o PostgreSQL está rodando e as credenciais estão corretas." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Conexão com o banco estabelecida!" -ForegroundColor Green
    Write-Host ""
    
    # Executar script de reset
    Write-Host "Executando reset do banco de dados..." -ForegroundColor Yellow
    $resetResult = & psql -U postgres -h localhost -d fluxbus -f reset_flyway_migrations.sql 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Banco de dados resetado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "AVISO: Houve alguns problemas durante o reset, mas pode estar tudo bem." -ForegroundColor Yellow
        Write-Host "Detalhes: $resetResult" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Agora você pode iniciar o backend!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "O Flyway vai executar todas as migrações novamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Inicie o backend (através da IDE ou Maven)" -ForegroundColor White
    Write-Host "2. Aguarde as migrações serem executadas" -ForegroundColor White
    Write-Host "3. Verifique se não há erros no log" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "ERRO: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD
}

