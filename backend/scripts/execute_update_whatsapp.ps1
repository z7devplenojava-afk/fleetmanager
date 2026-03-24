# ========================================
# SCRIPT PARA EXECUTAR ATUALIZACAO WHATSAPP
# ========================================
# Este script executa a atualizacao do campo whatsapp diretamente no banco

Write-Host "EXECUTANDO ATUALIZACAO WHATSAPP" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Verificar se o arquivo SQL existe
$sqlFile = "update_users_whatsapp_temp.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Arquivo SQL nao encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: .\update_users_whatsapp.ps1" -ForegroundColor Yellow
    exit 1
}

# Configuracoes do banco de dados
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "secured_guard_test"
$dbUser = "postgres"
$dbPassword = "1234567"

Write-Host "Conectando ao banco de dados..." -ForegroundColor Yellow
Write-Host "   Host: $dbHost" -ForegroundColor White
Write-Host "   Port: $dbPort" -ForegroundColor White
Write-Host "   Database: $dbName" -ForegroundColor White
Write-Host "   User: $dbUser" -ForegroundColor White

# Verificar se psql esta disponivel
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "psql encontrado: $psqlVersion" -ForegroundColor Green
    } else {
        throw "psql nao encontrado"
    }
} catch {
    Write-Host "psql nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale o PostgreSQL ou adicione ao PATH" -ForegroundColor Yellow
    exit 1
}

# Ler conteudo do SQL
$sqlContent = Get-Content $sqlFile -Raw

Write-Host "`nExecutando SQL..." -ForegroundColor Yellow

# Executar SQL
try {
    $env:PGPASSWORD = $dbPassword
    
    $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $sqlContent 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SQL executado com sucesso!" -ForegroundColor Green
        Write-Host "`nRESULTADO:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "Erro ao executar SQL:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao conectar ao banco: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpar variavel de ambiente
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "`nPROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Verifique se os dados foram atualizados corretamente" -ForegroundColor Cyan
Write-Host "2. Teste o envio de holerites via WhatsApp" -ForegroundColor Cyan
Write-Host "3. Verifique se os CPFs correspondem" -ForegroundColor Cyan

Write-Host "`nATUALIZACAO CONCLUIDA!" -ForegroundColor Green 