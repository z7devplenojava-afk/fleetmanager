# Teste Simples do Backend - EnvioHolerites

Write-Host "TESTE RAPIDO DO BACKEND" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Verificar Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "OK - Java: $javaVersion" -ForegroundColor Green
}
catch {
    Write-Host "ERRO - Java nao encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se backend existe
if (-not (Test-Path "backend")) {
    Write-Host "ERRO - Diretorio 'backend' nao encontrado!" -ForegroundColor Red
    exit 1
}

# Entrar no diretorio backend
Set-Location backend

# Compilar
Write-Host "Compilando..." -ForegroundColor Yellow
if (Test-Path "mvnw") {
    ./mvnw clean compile -q
} else {
    mvn clean compile -q
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO - Falha na compilacao" -ForegroundColor Red
    exit 1
}

Write-Host "OK - Backend compilado" -ForegroundColor Green

# Testes unitarios
Write-Host "Executando testes..." -ForegroundColor Yellow
if (Test-Path "mvnw") {
    ./mvnw test -q
} else {
    mvn test -q
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Testes passaram" -ForegroundColor Green
} else {
    Write-Host "ERRO - Testes falharam" -ForegroundColor Red
}

# Voltar ao diretorio original
Set-Location ..

Write-Host "Teste concluido!" -ForegroundColor Green 