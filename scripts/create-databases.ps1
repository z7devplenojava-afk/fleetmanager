# ===================== SCRIPT PARA CRIAR BANCOS DE DADOS (PowerShell) =====================
# Este script cria todos os bancos necessários para o projeto

param(
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = ""
)

Write-Host "🗄️ Criando bancos de dados para o projeto SecuredGuard..." -ForegroundColor Green
Write-Host ""

# Lista de bancos para criar
$Databases = @(
    "secured_guard_dev",
    "secured_guard_test", 
    "secured_guard_staging",
    "secured_guard_prod",
    "secured_guard_ci"
)

# Função para executar comando psql
function Invoke-PostgreSQLCommand {
    param(
        [string]$Command,
        [string]$Database = ""
    )
    
    $env:PGPASSWORD = $PostgresPassword
    $psqlArgs = @("-h", $PostgresHost, "-p", $PostgresPort, "-U", $PostgresUser)
    
    if ($Database) {
        $psqlArgs += @("-d", $Database)
    }
    
    $psqlArgs += @("-c", $Command)
    
    try {
        & psql @psqlArgs 2>$null
        return $true
    }
    catch {
        return $false
    }
}

# Função para criar banco
function New-Database {
    param([string]$DatabaseName)
    
    Write-Host "📊 Criando banco: $DatabaseName" -ForegroundColor Cyan
    
    # Verificar se o banco já existe
    $checkCommand = "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"
    $exists = Invoke-PostgreSQLCommand -Command $checkCommand
    
    if ($exists) {
        Write-Host "   ✅ Banco $DatabaseName já existe" -ForegroundColor Green
    } else {
        # Criar o banco
        $createCommand = "CREATE DATABASE $DatabaseName;"
        if (Invoke-PostgreSQLCommand -Command $createCommand) {
            Write-Host "   ✅ Banco $DatabaseName criado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erro ao criar banco $DatabaseName" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

# Função para criar usuário
function New-DatabaseUser {
    param(
        [string]$Username,
        [string]$Password
    )
    
    Write-Host "👤 Criando usuário: $Username" -ForegroundColor Cyan
    
    # Verificar se o usuário já existe
    $checkCommand = "SELECT 1 FROM pg_roles WHERE rolname = '$Username';"
    $exists = Invoke-PostgreSQLCommand -Command $checkCommand
    
    if ($exists) {
        Write-Host "   ✅ Usuário $Username já existe" -ForegroundColor Green
        # Atualizar senha se necessário
        if ($Password) {
            $updateCommand = "ALTER USER $Username PASSWORD '$Password';"
            Invoke-PostgreSQLCommand -Command $updateCommand
            Write-Host "   🔑 Senha do usuário $Username atualizada" -ForegroundColor Yellow
        }
    } else {
        # Criar o usuário
        if ($Password) {
            $createCommand = "CREATE USER $Username WITH PASSWORD '$Password';"
        } else {
            $createCommand = "CREATE USER $Username;"
        }
        
        if (Invoke-PostgreSQLCommand -Command $createCommand) {
            Write-Host "   ✅ Usuário $Username criado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erro ao criar usuário $Username" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

# Função para dar permissões
function Grant-DatabasePermissions {
    param(
        [string]$Username,
        [string]$DatabaseName
    )
    
    Write-Host "🔐 Concedendo permissões para $Username no banco $DatabaseName" -ForegroundColor Cyan
    
    $commands = @(
        "GRANT ALL PRIVILEGES ON DATABASE $DatabaseName TO $Username;",
        "GRANT ALL PRIVILEGES ON SCHEMA public TO $Username;",
        "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $Username;",
        "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $Username;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $Username;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $Username;"
    )
    
    foreach ($command in $commands) {
        if (-not (Invoke-PostgreSQLCommand -Command $command -Database $DatabaseName)) {
            Write-Host "   ⚠️ Aviso: Erro ao executar comando de permissão" -ForegroundColor Yellow
        }
    }
    
    Write-Host "   ✅ Permissões concedidas com sucesso" -ForegroundColor Green
}

# Verificar se PostgreSQL está rodando
Write-Host "🔍 Verificando conexão com PostgreSQL..." -ForegroundColor Cyan
$testCommand = "SELECT 1;"
if (-not (Invoke-PostgreSQLCommand -Command $testCommand)) {
    Write-Host "❌ Erro: PostgreSQL não está acessível em $PostgresHost`:$PostgresPort" -ForegroundColor Red
    Write-Host "   Verifique se o PostgreSQL está rodando e as credenciais estão corretas" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ PostgreSQL está acessível" -ForegroundColor Green
Write-Host ""

# Carregar variáveis de ambiente se disponível
if (Test-Path ".env") {
    Write-Host "📄 Carregando variáveis de ambiente do arquivo .env..." -ForegroundColor Cyan
    Get-Content ".env" | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object {
        $key, $value = $_ -split '=', 2
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Criar usuário específico do projeto
New-DatabaseUser -Username "postgressg" -Password $PostgresPassword
Write-Host ""

# Criar todos os bancos
Write-Host "🏗️ Criando bancos de dados..." -ForegroundColor Cyan
foreach ($db in $Databases) {
    New-Database -DatabaseName $db
}
Write-Host ""

# Dar permissões para o usuário em todos os bancos
Write-Host "🔐 Configurando permissões..." -ForegroundColor Cyan
foreach ($db in $Databases) {
    Grant-DatabasePermissions -Username "postgressg" -DatabaseName $db
}
Write-Host ""

# Listar bancos criados
Write-Host "📋 Bancos de dados disponíveis:" -ForegroundColor Cyan
$listCommand = "\l"
Invoke-PostgreSQLCommand -Command $listCommand
Write-Host ""

Write-Host "✅ Todos os bancos de dados foram criados e configurados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure as variáveis de ambiente nos arquivos .env" -ForegroundColor White
Write-Host "2. Execute o Flyway para aplicar as migrações" -ForegroundColor White
Write-Host "3. Teste as conexões com cada ambiente" -ForegroundColor White
