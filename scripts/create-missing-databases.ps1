# ===================== SCRIPT PARA CRIAR BANCOS FALTANTES (PowerShell) =====================
# Execute este script na VPS para criar os bancos que estão faltando

Write-Host "🔧 Criando bancos de dados faltantes..." -ForegroundColor Green
Write-Host ""

# Configurações
$PostgresHost = $env:POSTGRES_HOST ?? "localhost"
$PostgresPort = $env:POSTGRES_PORT ?? 5432
$PostgresUser = $env:POSTGRES_USER ?? "postgressg"
$PostgresPassword = $env:POSTGRES_PASSWORD ?? "S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx"

# Lista de bancos faltantes
$MissingDatabases = @(
    "secured_guard_dev",
    "secured_guard_test",
    "secured_guard_staging",
    "secured_guard_ci"
)

# Função para criar banco
function New-MissingDatabase {
    param([string]$DatabaseName)
    
    Write-Host "📊 Criando banco: $DatabaseName" -ForegroundColor Cyan
    
    # Verificar se o banco já existe
    $env:PGPASSWORD = $PostgresPassword
    $checkCommand = "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"
    $exists = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -tAc $checkCommand 2>$null
    
    if ($exists -and $exists.Trim() -eq "1") {
        Write-Host "   ✅ Banco $DatabaseName já existe" -ForegroundColor Green
    } else {
        # Criar o banco
        & createdb -h $PostgresHost -p $PostgresPort -U $PostgresUser $DatabaseName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Banco $DatabaseName criado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erro ao criar banco $DatabaseName" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

# Verificar se PostgreSQL está rodando
Write-Host "🔍 Verificando conexão com PostgreSQL..." -ForegroundColor Cyan
$env:PGPASSWORD = $PostgresPassword
$testCommand = "SELECT 1;"

try {
    & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -c $testCommand 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PostgreSQL está acessível" -ForegroundColor Green
    } else {
        throw "Conexão falhou"
    }
} catch {
    Write-Host "   ❌ PostgreSQL não está acessível" -ForegroundColor Red
    Write-Host "   Verifique se o PostgreSQL está rodando" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Criar bancos faltantes
Write-Host "🏗️ Criando bancos de dados..." -ForegroundColor Cyan
foreach ($db in $MissingDatabases) {
    New-MissingDatabase -DatabaseName $db
}
Write-Host ""

# Verificar bancos criados
Write-Host "📋 Verificando bancos criados..." -ForegroundColor Cyan
$env:PGPASSWORD = $PostgresPassword
& psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'secured_guard%';"
Write-Host ""

Write-Host "✅ Script concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Para conectar via DBeaver:" -ForegroundColor Cyan
Write-Host "  Host: $PostgresHost" -ForegroundColor White
Write-Host "  Porta: $PostgresPort" -ForegroundColor White
Write-Host "  Username: $PostgresUser" -ForegroundColor White
Write-Host "  Password: $PostgresPassword" -ForegroundColor White
