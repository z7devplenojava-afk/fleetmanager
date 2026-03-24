# Teste Rápido do Backend - EnvioHolerites

Write-Host "🧪 TESTE RÁPIDO DO BACKEND" -ForegroundColor Green

# Verificar Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java: $javaVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Java não encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se backend existe
if (-not (Test-Path "backend")) {
    Write-Host "❌ Diretório 'backend' não encontrado!" -ForegroundColor Red
    exit 1
}

# Entrar no diretório backend
Set-Location backend

# Compilar
Write-Host "🔨 Compilando..." -ForegroundColor Yellow
if (Test-Path "mvnw") {
    ./mvnw clean compile -q
} else {
    mvn clean compile -q
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha na compilação" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend compilado" -ForegroundColor Green

# Testes unitários
Write-Host "🧪 Executando testes..." -ForegroundColor Yellow
if (Test-Path "mvnw") {
    ./mvnw test -q
} else {
    mvn test -q
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Testes passaram" -ForegroundColor Green
} else {
    Write-Host "❌ Testes falharam" -ForegroundColor Red
}

# Voltar ao diretório original
Set-Location ..

Write-Host "✨ Teste concluído!" -ForegroundColor Green 