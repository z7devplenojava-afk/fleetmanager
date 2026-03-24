# =====================================================
# Script para aplicar correção do Flyway e testar
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  APLICAR CORREÇÃO DO FLYWAY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Correções aplicadas:" -ForegroundColor Green
Write-Host "  ✅ Adicionada dependência: flyway-database-postgresql" -ForegroundColor White
Write-Host "  ✅ Ativado logging DEBUG do Flyway" -ForegroundColor White
Write-Host ""

# Ir para o diretório backend
Set-Location backend

Write-Host "[1/4] Limpando compilações anteriores..." -ForegroundColor Yellow
& mvn clean -q

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Erro ao limpar!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "  ✓ Limpeza concluída!" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Baixando dependências e compilando..." -ForegroundColor Yellow
Write-Host "  (Isso vai baixar flyway-database-postgresql)" -ForegroundColor Cyan

& mvn package -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Erro na compilação!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "  ✓ Compilação concluída!" -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] Iniciando backend com perfil TEST..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AGUARDE OS LOGS DO FLYWAY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Você DEVE ver:" -ForegroundColor Yellow
Write-Host "  → Flyway Community Edition..." -ForegroundColor White
Write-Host "  → Database: jdbc:postgresql://localhost:5432/secured_guard_test" -ForegroundColor White
Write-Host "  → Migrating schema to version 226..." -ForegroundColor White
Write-Host "  → Migrating schema to version 227..." -ForegroundColor White
Write-Host "  → Migrating schema to version 228..." -ForegroundColor White
Write-Host "  → Successfully applied X migrations" -ForegroundColor White
Write-Host ""
Write-Host "Pressione Ctrl+C após ver 'Started SecuredGuardApplication'" -ForegroundColor Yellow
Write-Host ""

# Iniciar Spring Boot
& mvn spring-boot:run -Dspring-boot.run.profiles=test

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "O Flyway executou as migrações? (s/n)"

if ($continue -eq "s" -or $continue -eq "S") {
    Write-Host ""
    Write-Host "✅ SUCESSO! Flyway corrigido!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Execute verificar_migrations.ps1 para confirmar" -ForegroundColor White
    Write-Host "  2. Teste o dashboard em http://localhost:8081/api/dashboard/quick-stats" -ForegroundColor White
    Write-Host "  3. Não deve mais aparecer erro 'vehicle_maintenances não existe'" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Flyway ainda não executou" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  1. Dependência não foi baixada - execute novamente" -ForegroundColor White
    Write-Host "  2. Erro de conexão com o banco" -ForegroundColor White
    Write-Host "  3. Problema com o histórico do Flyway" -ForegroundColor White
    Write-Host ""
    Write-Host "Solução alternativa:" -ForegroundColor Cyan
    Write-Host "  Execute o script SQL no DBeaver:" -ForegroundColor White
    Write-Host "  EXECUTAR_AGORA_migrations_faltantes.sql" -ForegroundColor White
}

Write-Host ""

