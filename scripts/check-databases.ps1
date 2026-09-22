# ===================== SCRIPT PARA VERIFICAR BANCOS DE DADOS (PowerShell) =====================

Write-Host "🔍 Verificando bancos de dados FluxBus..." -ForegroundColor Green
Write-Host ""

# Configurações
$PostgresHost = $env:POSTGRES_HOST ?? "localhost"
$PostgresPort = $env:POSTGRES_PORT ?? 5432
$PostgresUser = $env:POSTGRES_USER ?? "postgressg"
$PostgresPassword = $env:POSTGRES_PASSWORD ?? "S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx"

# Lista de bancos esperados
$ExpectedDatabases = @(
    "fluxbus_dev",
    "fluxbus_test",
    "fluxbus_staging",
    "fluxbus_prod",
    "fluxbus_ci"
)

# Função para verificar banco
function Test-Database {
    param([string]$DatabaseName)
    
    Write-Host "📊 Verificando banco: $DatabaseName" -ForegroundColor Cyan
    
    # Verificar se o banco existe
    $env:PGPASSWORD = $PostgresPassword
    $checkCommand = "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"
    
    try {
        $exists = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -tAc $checkCommand 2>$null
        
        if ($exists -and $exists.Trim() -eq "1") {
            Write-Host "   ✅ Banco $DatabaseName existe" -ForegroundColor Green
            
            # Verificar se consegue conectar
            $testCommand = "SELECT 1;"
            try {
                & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName -c $testCommand 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Conexão com $DatabaseName funcionando" -ForegroundColor Green
                    
                    # Verificar tabelas
                    $tableCommand = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
                    $tableCount = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName -tAc $tableCommand 2>$null
                    Write-Host "   📋 Tabelas encontradas: $tableCount" -ForegroundColor White
                    
                    # Verificar migrações Flyway se existir tabela
                    $flywayCheckCommand = "SELECT 1 FROM information_schema.tables WHERE table_name='flyway_schema_history';"
                    $flywayExists = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName -tAc $flywayCheckCommand 2>$null
                    
                    if ($flywayExists -and $flywayExists.Trim() -eq "1") {
                        $migrationCommand = "SELECT COUNT(*) FROM flyway_schema_history;"
                        $migrationCount = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName -tAc $migrationCommand 2>$null
                        Write-Host "   🚀 Migrações Flyway: $migrationCount" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "   ❌ Erro na conexão com $DatabaseName" -ForegroundColor Red
                }
            } catch {
                Write-Host "   ❌ Erro na conexão com $DatabaseName" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Banco $DatabaseName não existe" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Erro ao verificar banco $DatabaseName" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Verificar conexão básica
Write-Host "🔌 Testando conexão com PostgreSQL..." -ForegroundColor Cyan
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
    Write-Host "   Verifique se o PostgreSQL está rodando e as credenciais estão corretas" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar cada banco
Write-Host "📋 Verificando bancos de dados..." -ForegroundColor Cyan
foreach ($db in $ExpectedDatabases) {
    Test-Database -DatabaseName $db
}

# Resumo final
Write-Host "==========================================" -ForegroundColor Green
Write-Host "📊 RESUMO DA VERIFICAÇÃO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Contar bancos existentes
$existingCount = 0
foreach ($db in $ExpectedDatabases) {
    $checkCommand = "SELECT 1 FROM pg_database WHERE datname = '$db';"
    try {
        $exists = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -tAc $checkCommand 2>$null
        if ($exists -and $exists.Trim() -eq "1") {
            $existingCount++
        }
    } catch {
        # Banco não existe
    }
}

Write-Host "Bancos esperados: $($ExpectedDatabases.Count)" -ForegroundColor White
Write-Host "Bancos encontrados: $existingCount" -ForegroundColor White

if ($existingCount -eq $ExpectedDatabases.Count) {
    Write-Host "✅ Todos os bancos foram criados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Alguns bancos podem estar faltando" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para criar os bancos faltantes, execute:" -ForegroundColor White
    Write-Host "  .\scripts\create-databases.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🔗 Para conectar via DBeaver:" -ForegroundColor Cyan
Write-Host "  Host: $PostgresHost" -ForegroundColor White
Write-Host "  Porta: $PostgresPort" -ForegroundColor White
Write-Host "  Username: $PostgresUser" -ForegroundColor White
Write-Host "  Password: $PostgresPassword" -ForegroundColor White
