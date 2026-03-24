# Script PowerShell para gerar INSERTs do banco secured_guard_test e atualizar a migration V999

param(
    [string]$DB_HOST = "localhost",
    [int]$DB_PORT = 5432,
    [string]$DB_USER = "postgressg",
    [string]$DB_PASSWORD = "1234567",
    [string]$DB_NAME = "secured_guard_test"
)

$ErrorActionPreference = "Stop"

Write-Host "[*] Gerando INSERTs do banco $DB_NAME" -ForegroundColor Green
Write-Host "=" * 50
Write-Host ""

# Verificar se psql está disponível
$psqlPath = $null

# Tentar encontrar psql no PATH
if (Get-Command psql -ErrorAction SilentlyContinue) {
    $psqlPath = "psql"
} else {
    # Procurar em locais comuns do PostgreSQL no Windows
    $commonPaths = @(
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\14\bin\psql.exe",
        "C:\Program Files\PostgreSQL\13\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\13\bin\psql.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            Write-Host "[OK] psql encontrado em: $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not $psqlPath) {
        Write-Host "[ERRO] psql nao encontrado. Instale o PostgreSQL client." -ForegroundColor Red
        Write-Host "       Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        Write-Host "       Ou adicione o PostgreSQL ao PATH do sistema." -ForegroundColor Yellow
        exit 1
    }
}

# Caminhos
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$MIGRATION_FILE = Join-Path $SCRIPT_DIR "V999__seed_ci_essential_data.sql"
$TEMP_DIR = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_.FullName }

try {
    Write-Host "[*] Conectando ao banco $DB_NAME..." -ForegroundColor Yellow
    
    # Exportar usuários
    Write-Host "[*] Gerando INSERTs de usuarios..." -ForegroundColor Yellow
    $env:PGPASSWORD = $DB_PASSWORD
    $usersFile = Join-Path $TEMP_DIR "users.sql"
    $userRolesFile = Join-Path $TEMP_DIR "user_roles.sql"
    
    # Executar query SQL para gerar INSERTs de usuários
    $usersQuery = @'
SELECT 
    'INSERT INTO users (' ||
    'id, username, password, email, name, status, active, ' ||
    'two_factor_enabled, two_factor_whatsapp, require_password_change, ' ||
    'last_password_change, first_access_completed, whatsapp, ' ||
    'whatsapp_consent, whatsapp_consent_date, whatsapp_consent_ip, whatsapp_consent_user_agent, ' ||
    'created_at, updated_at' ||
    ') VALUES (' ||
    '''' || id || ''', ' ||
    '''' || REPLACE(username, '''', '''''') || ''', ' ||
    '''' || REPLACE(password, '''', '''''') || ''', ' ||
    '''' || REPLACE(email, '''', '''''') || ''', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    '''' || status || ''', ' ||
    COALESCE(active::text, 'true') || ', ' ||
    COALESCE(two_factor_enabled::text, 'false') || ', ' ||
    COALESCE('''' || REPLACE(two_factor_whatsapp, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(require_password_change::text, 'false') || ', ' ||
    COALESCE('''' || last_password_change::text || '''', 'NULL') || ', ' ||
    COALESCE(first_access_completed::text, 'false') || ', ' ||
    COALESCE('''' || REPLACE(whatsapp, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(whatsapp_consent::text, 'false') || ', ' ||
    COALESCE('''' || whatsapp_consent_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(whatsapp_consent_ip, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(whatsapp_consent_user_agent, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NOW()') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NOW()') ||
    ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM users
WHERE username != 'admin@ci'
ORDER BY username;
'@
    
    $env:PGPASSWORD = $DB_PASSWORD
    & $psqlPath -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c $usersQuery | 
        Where-Object { $_ -match "INSERT INTO users" } | 
        Out-File -FilePath $usersFile -Encoding UTF8
    
    $userCount = (Get-Content $usersFile | Measure-Object -Line).Lines
    Write-Host "[OK] $userCount usuarios gerados" -ForegroundColor Green
    
    # Exportar user_roles
    Write-Host "[*] Gerando INSERTs de user_roles..." -ForegroundColor Yellow
    $userRolesQuery = @'
SELECT 
    'INSERT INTO user_roles (user_id, role_id, created_at) ' ||
    'SELECT ' ||
    '''' || ur.user_id || ''', ' ||
    'r.id, ' ||
    'NOW() ' ||
    'FROM roles r ' ||
    'WHERE r.name = ''' || r.name || ''' ' ||
    'AND NOT EXISTS (' ||
    '    SELECT 1 FROM user_roles ur2 ' ||
    '    WHERE ur2.user_id = ''' || ur.user_id || ''' ' ||
    '    AND ur2.role_id = r.id' ||
    ');' as insert_statement
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE u.username != 'admin@ci'
ORDER BY u.username, r.name;
'@
    
    & $psqlPath -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c $userRolesQuery | 
        Where-Object { $_ -match "INSERT INTO user_roles" } | 
        Out-File -FilePath $userRolesFile -Encoding UTF8
    
    $roleCount = (Get-Content $userRolesFile | Measure-Object -Line).Lines
    Write-Host "[OK] $roleCount user_roles gerados" -ForegroundColor Green
    
    # Exportar funcionários (usar o script SQL existente)
    Write-Host "[*] Gerando INSERTs de funcionarios..." -ForegroundColor Yellow
    $employeesFile = Join-Path $TEMP_DIR "employees.sql"
    $exportScript = Join-Path $SCRIPT_DIR "export_employees_from_test_db.sql"
    
    if (Test-Path $exportScript) {
        & $psqlPath -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -f $exportScript | 
            Where-Object { $_ -match "INSERT INTO employees" } | 
            Out-File -FilePath $employeesFile -Encoding UTF8
    } else {
        Write-Host "[AVISO] Script de exportacao nao encontrado, pulando funcionarios" -ForegroundColor Yellow
        "" | Out-File -FilePath $employeesFile -Encoding UTF8
    }
    
    $employeeCount = (Get-Content $employeesFile | Measure-Object -Line).Lines
    Write-Host "[OK] $employeeCount funcionarios gerados" -ForegroundColor Green
    Write-Host ""
    
    # Atualizar migration
    Write-Host "[*] Atualizando migration..." -ForegroundColor Yellow
    
    if (-not (Test-Path $MIGRATION_FILE)) {
        Write-Host "[ERRO] Migration nao encontrada: $MIGRATION_FILE" -ForegroundColor Red
        exit 1
    }
    
    # Criar backup
    $backupFile = "$MIGRATION_FILE.backup"
    Copy-Item $MIGRATION_FILE $backupFile
    Write-Host "Backup criado: $backupFile" -ForegroundColor Cyan
    
    # Ler migration
    $content = Get-Content $MIGRATION_FILE -Raw -Encoding UTF8
    
    # Ler INSERTs gerados
    $usersInserts = if (Test-Path $usersFile) { Get-Content $usersFile -Raw -Encoding UTF8 } else { "" }
    $userRolesInserts = if (Test-Path $userRolesFile) { Get-Content $userRolesFile -Raw -Encoding UTF8 } else { "" }
    $employeesInserts = if (Test-Path $employeesFile) { Get-Content $employeesFile -Raw -Encoding UTF8 } else { "" }
    
    # Atualizar seção 7.1.1 (usuários)
    $marker1 = "-- COLE OS INSERTs DE USUÁRIOS AQUI (se dblink não funcionar):"
    if ($usersInserts -and $content -match $marker1) {
        $content = $content -replace ([regex]::Escape($marker1), "$marker1`n`n$usersInserts")
        Write-Host "[OK] Secao 7.1.1 atualizada (usuarios)" -ForegroundColor Green
    }
    
    # Atualizar seção 7.2 (user_roles)
    $marker2 = "-- COLE OS INSERTs DE USER_ROLES AQUI (se dblink não funcionar):"
    if ($userRolesInserts -and $content -match $marker2) {
        $content = $content -replace ([regex]::Escape($marker2), "$marker2`n`n$userRolesInserts")
        Write-Host "[OK] Secao 7.2 atualizada (user_roles)" -ForegroundColor Green
    }
    
    # Atualizar seção 8.1 (funcionários)
    $marker3 = "-- COLE OS INSERTs DE FUNCIONÁRIOS AQUI (se dblink não funcionar):"
    if ($employeesInserts -and $content -match $marker3) {
        $content = $content -replace ([regex]::Escape($marker3), "$marker3`n`n$employeesInserts")
        Write-Host "[OK] Secao 8.1 atualizada (funcionarios)" -ForegroundColor Green
    }
    
    # Salvar migration atualizada
    $content | Out-File -FilePath $MIGRATION_FILE -Encoding UTF8 -NoNewline
    Write-Host "[OK] Migration atualizada: $MIGRATION_FILE" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=" * 50
    Write-Host "[OK] Processo concluido com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[*] Resumo:" -ForegroundColor Cyan
    Write-Host "   - Usuarios: $userCount"
    Write-Host "   - User_roles: $roleCount"
    Write-Host "   - Funcionarios: $employeeCount"
    Write-Host ""
    Write-Host "[*] Proximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Revise a migration atualizada"
    Write-Host "   2. Faça commit e push"
    Write-Host "   3. No próximo deploy, os dados serão copiados automaticamente"
    
} catch {
    Write-Host "[ERRO] Erro: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpar
    Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

