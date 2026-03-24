# Script para executar a migração de reconhecimento facial
# Execute este script no PowerShell como administrador

Write-Host "Executando migração de reconhecimento facial..." -ForegroundColor Yellow

# Caminho para o arquivo SQL
$sqlFile = "create_facial_recognition_tables.sql"

# Verificar se o arquivo existe
if (-not (Test-Path $sqlFile)) {
    Write-Host "Erro: Arquivo $sqlFile não encontrado!" -ForegroundColor Red
    exit 1
}

# Comando para executar o SQL
$command = "psql -h localhost -p 5432 -U postgres -d secured_guard -f $sqlFile"

Write-Host "Executando comando: $command" -ForegroundColor Cyan

try {
    # Executar o comando
    Invoke-Expression $command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migração executada com sucesso!" -ForegroundColor Green
        Write-Host "Tabelas criadas:" -ForegroundColor Green
        Write-Host "  - employee_faces" -ForegroundColor White
        Write-Host "  - facial_recognition_logs" -ForegroundColor White
        Write-Host "  - facial_recognition_config" -ForegroundColor White
    } else {
        Write-Host "Erro ao executar migração. Código de saída: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao executar migração: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Certifique-se de que o PostgreSQL está rodando e o psql está no PATH" -ForegroundColor Yellow
}

Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
