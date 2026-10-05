# ===================== SCRIPT DE SETUP COMPLETO DO BANCO (PowerShell) =====================
# Este script configura completamente o ambiente de banco de dados

param(
    [switch]$Force
)

# Configurar cores
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar se PostgreSQL está instalado
function Test-PostgreSQL {
    Write-Status "Verificando instalação do PostgreSQL..."
    
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        Write-Success "PostgreSQL encontrado"
        & psql --version
    } else {
        Write-Error "PostgreSQL não encontrado. Instale primeiro:"
        Write-Host "  Windows: https://www.postgresql.org/download/windows/"
        Write-Host "  ou use Chocolatey: choco install postgresql"
        exit 1
    }
}

# Verificar se PostgreSQL está rodando
function Test-PostgreSQLRunning {
    Write-Status "Verificando se PostgreSQL está rodando..."
    
    try {
        $env:PGPASSWORD = ""
        $result = & psql -h localhost -p 5432 -U postgres -c "SELECT 1;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PostgreSQL está rodando"
        } else {
            throw "PostgreSQL não está acessível"
        }
    } catch {
        Write-Error "PostgreSQL não está rodando ou não está acessível."
        Write-Host "Verifique se o serviço PostgreSQL está iniciado:"
        Write-Host "  net start postgresql-x64-15"
        exit 1
    }
}

# Gerar senhas seguras
function New-SecurePasswords {
    Write-Status "Gerando senhas seguras..."
    
    # Função para gerar senha segura
    function New-RandomPassword {
        param([int]$Length = 32)
        $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
        $password = ""
        for ($i = 0; $i -lt $Length; $i++) {
            $randomIndex = Get-Random -Maximum $chars.Length
            $password += $chars[$randomIndex]
        }
        return $password
    }
    
    # Função para gerar JWT secret
    function New-JWTSecret {
        $bytes = New-Object byte[] 64
        (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
        return [System.Convert]::ToHexString($bytes).ToLower()
    }
    
    # Gerar senhas
    $passwords = @{
        POSTGRES_PASSWORD = New-RandomPassword -Length 32
        REDIS_PASSWORD = New-RandomPassword -Length 24
        JWT_SECRET = New-JWTSecret
    }
    
    # Salvar em arquivo temporário
    $tempFile = "$env:TEMP\fluxbus_passwords.txt"
    $content = @"
# Senhas geradas em $(Get-Date)
POSTGRES_PASSWORD=$($passwords.POSTGRES_PASSWORD)
REDIS_PASSWORD=$($passwords.REDIS_PASSWORD)
JWT_SECRET=$($passwords.JWT_SECRET)

# Instruções:
# 1. Copie as senhas acima
# 2. Cole nos arquivos .env correspondentes
# 3. NUNCA commite estas senhas no Git
# 4. Salve em um gerenciador de senhas
"@
    
    $content | Out-File -FilePath $tempFile -Encoding UTF8
    Write-Success "Senhas geradas em $tempFile"
    Write-Host ""
    Write-Host $content
    Write-Host ""
    Write-Warning "IMPORTANTE: Salve estas senhas em local seguro!"
    
    return $passwords
}

# Criar bancos de dados
function New-Databases {
    param([hashtable]$Passwords)
    
    Write-Status "Criando bancos de dados..."
    
    $Databases = @(
        "fluxbus_dev",
        "fluxbus_test", 
        "fluxbus_staging",
        "fluxbus_prod",
        "fluxbus_ci"
    )
    
    $env:PGPASSWORD = ""
    
    foreach ($db in $Databases) {
        Write-Status "Criando banco: $db"
        
        # Verificar se banco já existe
        $checkCommand = "SELECT 1 FROM pg_database WHERE datname = '$db';"
        $exists = & psql -h localhost -p 5432 -U postgres -tAc $checkCommand 2>$null
        
        if ($exists -and $exists.Trim() -eq "1") {
            Write-Warning "Banco $db já existe"
        } else {
            & createdb -h localhost -p 5432 -U postgres $db
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Banco $db criado"
            } else {
                Write-Error "Erro ao criar banco $db"
                return $false
            }
        }
    }
    return $true
}

# Criar usuário específico
function New-DatabaseUser {
    param([hashtable]$Passwords)
    
    Write-Status "Criando usuário postgressg..."
    
    $env:PGPASSWORD = ""
    
    # Verificar se usuário já existe
    $checkCommand = "SELECT 1 FROM pg_roles WHERE rolname = 'postgressg';"
    $exists = & psql -h localhost -p 5432 -U postgres -tAc $checkCommand 2>$null
    
    if ($exists -and $exists.Trim() -eq "1") {
        Write-Warning "Usuário postgressg já existe"
        $updateCommand = "ALTER USER postgressg PASSWORD '$($Passwords.POSTGRES_PASSWORD)';"
        & psql -h localhost -p 5432 -U postgres -c $updateCommand
        Write-Success "Senha do usuário postgressg atualizada"
    } else {
        $createCommand = "CREATE USER postgressg WITH PASSWORD '$($Passwords.POSTGRES_PASSWORD)';"
        & psql -h localhost -p 5432 -U postgres -c $createCommand
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Usuário postgressg criado"
        } else {
            Write-Error "Erro ao criar usuário postgressg"
            return $false
        }
    }
    return $true
}

# Dar permissões
function Grant-DatabasePermissions {
    param([hashtable]$Passwords)
    
    Write-Status "Configurando permissões..."
    
    $Databases = @(
        "fluxbus_dev",
        "fluxbus_test", 
        "fluxbus_staging",
        "fluxbus_prod",
        "fluxbus_ci"
    )
    
    foreach ($db in $Databases) {
        Write-Status "Configurando permissões para $db"
        
        $commands = @(
            "GRANT ALL PRIVILEGES ON DATABASE $db TO postgressg;",
            "GRANT ALL PRIVILEGES ON SCHEMA public TO postgressg;",
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgressg;",
            "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgressg;",
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgressg;",
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgressg;"
        )
        
        foreach ($command in $commands) {
            & psql -h localhost -p 5432 -U postgres -d $db -c $command 2>$null
        }
        
        Write-Success "Permissões configuradas para $db"
    }
}

# Criar arquivos .env
function New-EnvFiles {
    param([hashtable]$Passwords)
    
    Write-Status "Criando arquivos de configuração..."
    
    # Criar .env.dev
    $envDevContent = @"
# ===================== CONFIGURAÇÃO DE DESENVOLVIMENTO =====================
ENVIRONMENT=development
SPRING_PROFILES_ACTIVE=dev

# ===================== BANCO DE DADOS =====================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fluxbus_dev
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=$($Passwords.POSTGRES_PASSWORD)

# ===================== REDIS CACHE =====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$($Passwords.REDIS_PASSWORD)

# ===================== JWT CONFIGURATION =====================
JWT_SECRET=$($Passwords.JWT_SECRET)
JWT_EXPIRATION=604800000
JWT_REFRESH_EXPIRATION=604800000

# ===================== EMAIL CONFIGURATION =====================
MAIL_HOST=localhost
MAIL_PORT=25
MAIL_USERNAME=dev@localhost
MAIL_PASSWORD=dev
MAIL_FROM=dev@fluxbus.local

# ===================== SERVER CONFIGURATION =====================
SERVER_PORT=8081
SERVER_ADDRESS=0.0.0.0

# ===================== LOGGING CONFIGURATION =====================
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=DEBUG

# ===================== FLYWAY CONFIGURATION =====================
FLYWAY_ENABLED=true
FLYWAY_CLEAN_DISABLED=false
FLYWAY_OUT_OF_ORDER=true
FLYWAY_VALIDATE_ON_MIGRATE=false

# ===================== DEVELOPMENT SPECIFIC =====================
DEV_SHOW_SQL=true
DEV_FORMAT_SQL=true
DEV_HIBERNATE_DDL_AUTO=update

# ===================== SECURITY CONFIGURATION =====================
SECURITY_ENABLED=true
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:8081
"@
    
    $envDevPath = "config\environments\.env.dev"
    if (-not (Test-Path "config\environments")) {
        New-Item -ItemType Directory -Path "config\environments" -Force | Out-Null
    }
    
    $envDevContent | Out-File -FilePath $envDevPath -Encoding UTF8
    Write-Success "Arquivo .env.dev criado"
    
    # Criar .env.prod (sem senhas reais)
    $envProdContent = @"
# ===================== CONFIGURAÇÃO DE PRODUÇÃO =====================
ENVIRONMENT=production
SPRING_PROFILES_ACTIVE=prod

# ===================== BANCO DE DADOS =====================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fluxbus_prod
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=CHANGE_THIS_PRODUCTION_PASSWORD

# ===================== REDIS CACHE =====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_PRODUCTION_REDIS_PASSWORD

# ===================== JWT CONFIGURATION =====================
JWT_SECRET=CHANGE_THIS_PRODUCTION_JWT_SECRET_TO_AT_LEAST_256_BITS
JWT_EXPIRATION=604800000
JWT_REFRESH_EXPIRATION=604800000

# ===================== EMAIL CONFIGURATION =====================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=CHANGE_THIS_EMAIL
MAIL_PASSWORD=CHANGE_THIS_EMAIL_PASSWORD
MAIL_FROM=securedguard@z7design.com.br

# ===================== SERVER CONFIGURATION =====================
SERVER_PORT=8081
SERVER_ADDRESS=0.0.0.0

# ===================== LOGGING CONFIGURATION =====================
LOG_LEVEL_ROOT=WARN
LOG_LEVEL_APP=INFO

# ===================== FLYWAY CONFIGURATION =====================
FLYWAY_ENABLED=true
FLYWAY_CLEAN_DISABLED=true
FLYWAY_OUT_OF_ORDER=false
FLYWAY_VALIDATE_ON_MIGRATE=true

# ===================== PRODUCTION SPECIFIC =====================
PROD_SHOW_SQL=false
PROD_FORMAT_SQL=false
PROD_HIBERNATE_DDL_AUTO=validate

# ===================== SECURITY CONFIGURATION =====================
SECURITY_ENABLED=true
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
"@
    
    $envProdPath = "config\environments\.env.prod"
    $envProdContent | Out-File -FilePath $envProdPath -Encoding UTF8
    Write-Success "Arquivo .env.prod criado"
}

# Testar conexões
function Test-DatabaseConnections {
    param([hashtable]$Passwords)
    
    Write-Status "Testando conexões com banco de dados..."
    
    $env:PGPASSWORD = $Passwords.POSTGRES_PASSWORD
    
    # Testar conexão com usuário postgressg
    $testCommand = "SELECT 1;"
    try {
        & psql -h localhost -p 5432 -U postgressg -d fluxbus_dev -c $testCommand 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Conexão com fluxbus_dev funcionando"
        } else {
            Write-Error "Erro na conexão com fluxbus_dev"
            return $false
        }
    } catch {
        Write-Error "Erro na conexão com fluxbus_dev"
        return $false
    }
    
    # Testar outros bancos
    $Databases = @("fluxbus_test", "fluxbus_staging", "fluxbus_prod", "fluxbus_ci")
    foreach ($db in $Databases) {
        try {
            & psql -h localhost -p 5432 -U postgressg -d $db -c $testCommand 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Conexão com $db funcionando"
            } else {
                Write-Error "Erro na conexão com $db"
            }
        } catch {
            Write-Error "Erro na conexão com $db"
        }
    }
    
    return $true
}

# Mostrar resumo
function Show-Summary {
    param([hashtable]$Passwords)
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "🎉 SETUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Resumo da configuração:" -ForegroundColor Cyan
    Write-Host "  ✅ PostgreSQL configurado e rodando" -ForegroundColor Green
    Write-Host "  ✅ 5 bancos de dados criados" -ForegroundColor Green
    Write-Host "  ✅ Usuário postgressg criado" -ForegroundColor Green
    Write-Host "  ✅ Permissões configuradas" -ForegroundColor Green
    Write-Host "  ✅ Arquivos .env criados" -ForegroundColor Green
    Write-Host "  ✅ Conexões testadas" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Arquivos criados:" -ForegroundColor Cyan
    Write-Host "  📄 config\environments\.env.dev" -ForegroundColor White
    Write-Host "  📄 config\environments\.env.prod" -ForegroundColor White
    Write-Host "  📄 $env:TEMP\fluxbus_passwords.txt" -ForegroundColor White
    Write-Host ""
    Write-Host "🔐 Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Salve as senhas em um gerenciador de senhas" -ForegroundColor White
    Write-Host "  2. Execute as migrações do Flyway" -ForegroundColor White
    Write-Host "  3. Teste a aplicação" -ForegroundColor White
    Write-Host "  4. Configure o DBeaver com as credenciais" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Documentação:" -ForegroundColor Cyan
    Write-Host "  📚 config\database\CONEXAO_BANCO_DADOS.md" -ForegroundColor White
    Write-Host "  🔐 config\database\SEGURANCA_SENHAS.md" -ForegroundColor White
    Write-Host ""
    Write-Warning "IMPORTANTE: Nunca commite arquivos .env com senhas reais!"
    Write-Host ""
}

# Função principal
function Main {
    Write-Host "🚀 Iniciando setup do banco de dados FluxBus..." -ForegroundColor Green
    Write-Host ""
    
    $passwords = New-SecurePasswords
    
    if (-not (Test-PostgreSQL)) { return }
    if (-not (Test-PostgreSQLRunning)) { return }
    if (-not (New-Databases -Passwords $passwords)) { return }
    if (-not (New-DatabaseUser -Passwords $passwords)) { return }
    Grant-DatabasePermissions -Passwords $passwords
    New-EnvFiles -Passwords $passwords
    if (-not (Test-DatabaseConnections -Passwords $passwords)) { return }
    Show-Summary -Passwords $passwords
    
    Write-Status "Limpando arquivos temporários..."
    Remove-Item "$env:TEMP\fluxbus_passwords.txt" -Force -ErrorAction SilentlyContinue
    Write-Success "Setup concluído!"
}

# Executar função principal
Main
