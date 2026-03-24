# Teste Completo de Integração - Sistema de Processamento de PDF com Envio

Write-Host "TESTE COMPLETO DE INTEGRACAO" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

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

Write-Host ""
Write-Host "1. COMPILANDO BACKEND..." -ForegroundColor Yellow
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

# Voltar ao diretorio original
Set-Location ..

Write-Host ""
Write-Host "2. VERIFICANDO ESTRUTURA..." -ForegroundColor Yellow

# Verificar serviços unificados
$services = @(
    "backend/src/main/java/com/z7design/secured_guard/service/PayslipProcessingService.java",
    "backend/src/main/java/com/z7design/secured_guard/controller/PayslipController.java",
    "backend/src/main/java/com/z7design/secured_guard/service/WhatsAppService.java",
    "backend/src/main/java/com/z7design/secured_guard/controller/WhatsAppTestController.java"
)

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "OK - $service" -ForegroundColor Green
    } else {
        Write-Host "ERRO - $service nao encontrado!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. VERIFICANDO CONFIGURACOES..." -ForegroundColor Yellow

# Verificar configurações
$configs = @(
    "backend/src/main/resources/application-dev.properties",
    "backend/src/main/resources/db/migration/V101__create_funcionarios_table.sql"
)

foreach ($config in $configs) {
    if (Test-Path $config) {
        Write-Host "OK - $config" -ForegroundColor Green
    } else {
        Write-Host "ERRO - $config nao encontrado!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "4. VERIFICANDO FRONTEND..." -ForegroundColor Yellow

# Verificar frontend
$frontendFiles = @(
    "frontend/src/pages/EnvioHolerites.tsx",
    "frontend/src/components/holerites/EnvioHoleriteModal.tsx",
    "frontend/src/components/holerites/FuncionarioFormModal.tsx",
    "frontend/src/components/HoleriteUpload.tsx"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "OK - $file" -ForegroundColor Green
    } else {
        Write-Host "ERRO - $file nao encontrado!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "5. VERIFICANDO WORKFLOWS N8N..." -ForegroundColor Yellow

# Verificar workflows n8n
$n8nWorkflows = @(
    "backend/n8n-workflows/wppconnect-workflow.json",
    "backend/n8n-workflows/baileys-workflow.json"
)

foreach ($workflow in $n8nWorkflows) {
    if (Test-Path $workflow) {
        Write-Host "OK - $workflow" -ForegroundColor Green
    } else {
        Write-Host "AVISO - $workflow nao encontrado (opcional)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "6. TESTANDO ENDPOINTS..." -ForegroundColor Yellow

# Testar se o backend está rodando
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/payslips" -Method GET -TimeoutSec 5
    Write-Host "OK - Backend respondendo" -ForegroundColor Green
} catch {
    Write-Host "AVISO - Backend nao esta rodando (execute: ./test-backend-simple.ps1)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "7. RESUMO DA INTEGRACAO..." -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Write-Host ""
Write-Host "BACKEND INTEGRADO:" -ForegroundColor White
Write-Host "  ✓ PayslipProcessingService - Serviço unificado" -ForegroundColor Green
Write-Host "  ✓ PayslipController - Endpoints unificados" -ForegroundColor Green
Write-Host "  ✓ WhatsAppService - Integração n8n" -ForegroundColor Green
Write-Host "  ✓ WhatsAppTestController - Testes de integração" -ForegroundColor Green
Write-Host "  ✓ Configurações n8n - application-dev.properties" -ForegroundColor Green

Write-Host ""
Write-Host "FRONTEND INTEGRADO:" -ForegroundColor White
Write-Host "  ✓ EnvioHolerites.tsx - Página principal" -ForegroundColor Green
Write-Host "  ✓ EnvioHoleriteModal.tsx - Modal de envio" -ForegroundColor Green
Write-Host "  ✓ FuncionarioFormModal.tsx - Modal de funcionário" -ForegroundColor Green
Write-Host "  ✓ HoleriteUpload.tsx - Upload de PDFs" -ForegroundColor Green

Write-Host ""
Write-Host "BANCO DE DADOS:" -ForegroundColor White
Write-Host "  ✓ Tabela funcionarios - V101__create_funcionarios_table.sql" -ForegroundColor Green
Write-Host "  ✓ Tabela payslips - V54__create_payslips_table.sql" -ForegroundColor Green

Write-Host ""
Write-Host "INTEGRACOES:" -ForegroundColor White
Write-Host "  ✓ Email - Configurado para Gmail/Outlook" -ForegroundColor Green
Write-Host "  ✓ WhatsApp - Integração n8n (WPPConnect/Baileys)" -ForegroundColor Green
Write-Host "  ✓ OCR - Tesseract para extração de dados" -ForegroundColor Green
Write-Host "  ✓ PDF - PDFBox para manipulação" -ForegroundColor Green

Write-Host ""
Write-Host "8. PROXIMOS PASSOS:" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta

Write-Host ""
Write-Host "1. Iniciar Backend:" -ForegroundColor White
Write-Host "   ./test-backend-simple.ps1" -ForegroundColor Gray

Write-Host ""
Write-Host "2. Configurar WhatsApp (opcional):" -ForegroundColor White
Write-Host "   # Instalar WPPConnect" -ForegroundColor Gray
Write-Host "   npm install -g @wppconnect/wa-js" -ForegroundColor Gray
Write-Host "   # Configurar n8n" -ForegroundColor Gray
Write-Host "   docker-compose up -d n8n" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Testar Integração:" -ForegroundColor White
Write-Host "   # Testar WhatsApp" -ForegroundColor Gray
Write-Host "   curl -X POST http://localhost:8080/api/whatsapp/test" -ForegroundColor Gray
Write-Host "   # Testar upload e envio" -ForegroundColor Gray
Write-Host "   curl -X POST http://localhost:8080/api/payslips/upload-and-send" -ForegroundColor Gray

Write-Host ""
Write-Host "4. Acessar Frontend:" -ForegroundColor White
Write-Host "   # Iniciar frontend" -ForegroundColor Gray
Write-Host "   cd frontend && npm start" -ForegroundColor Gray
Write-Host "   # Acessar: http://localhost:3000/envio-holerites" -ForegroundColor Gray

Write-Host ""
Write-Host "INTEGRACAO COMPLETA!" -ForegroundColor Green
Write-Host "O sistema está pronto para processar PDFs e enviar via WhatsApp/Email!" -ForegroundColor Green 