# Script para testar integração n8n com WhatsApp
# Autor: Sistema SecuredGuard
# Data: 2024

Write-Host "=== TESTE DE INTEGRAÇÃO N8N WHATSAPP ===" -ForegroundColor Green
Write-Host ""

# Configurações
$n8nUrl = "http://localhost:5678"
$wppconnectUrl = "http://localhost:21465"
$backendUrl = "http://localhost:8080"
$testPhone = "5511999999999"
$testMessage = "Teste de integração n8n - SecuredGuard"

# Função para testar conectividade
function Test-Connectivity {
    param($url, $name)
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5
        Write-Host "✓ $name está acessível" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ $name não está acessível: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar webhook n8n
function Test-N8nWebhook {
    Write-Host "Testando webhook n8n..." -ForegroundColor Yellow
    
    $payload = @{
        phoneNumber = $testPhone
        message = $testMessage
        provider = "wppconnect"
        sessionName = "securedguard"
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$n8nUrl/webhook/whatsapp" -Method POST -Body $payload -ContentType "application/json" -TimeoutSec 10
        Write-Host "✓ Webhook n8n respondeu: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Resposta: $($response.Content)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "✗ Erro no webhook n8n: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar WPPConnect
function Test-WPPConnect {
    Write-Host "Testando WPPConnect..." -ForegroundColor Yellow
    
    try {
        # Testar status da sessão
        $response = Invoke-WebRequest -Uri "$wppconnectUrl/api/sessions/status/securedguard" -TimeoutSec 5
        Write-Host "✓ WPPConnect está acessível" -ForegroundColor Green
        
        # Verificar se a sessão existe
        if ($response.Content -like "*not found*") {
            Write-Host "⚠ Sessão 'securedguard' não encontrada. Criando..." -ForegroundColor Yellow
            
            $createSession = @{
                sessionName = "securedguard"
            } | ConvertTo-Json
            
            $createResponse = Invoke-WebRequest -Uri "$wppconnectUrl/api/sessions/add" -Method POST -Body $createSession -ContentType "application/json"
            Write-Host "✓ Sessão criada" -ForegroundColor Green
        } else {
            Write-Host "✓ Sessão 'securedguard' existe" -ForegroundColor Green
        }
        
        return $true
    } catch {
        Write-Host "✗ Erro no WPPConnect: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar backend
function Test-Backend {
    Write-Host "Testando backend..." -ForegroundColor Yellow
    
    try {
        # Testar se o backend está rodando
        $response = Invoke-WebRequest -Uri "$backendUrl/actuator/health" -TimeoutSec 5
        Write-Host "✓ Backend está rodando" -ForegroundColor Green
        
        # Testar endpoint de envio WhatsApp (simulado)
        $testPayload = @{
            phoneNumber = $testPhone
            message = $testMessage
            payslipId = 1
        } | ConvertTo-Json
        
        Write-Host "⚠ Testando endpoint de envio (requer autenticação)..." -ForegroundColor Yellow
        Write-Host "Para testar completamente, use um token JWT válido" -ForegroundColor Gray
        
        return $true
    } catch {
        Write-Host "✗ Erro no backend: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para gerar relatório
function Write-Report {
    param($n8nStatus, $wppconnectStatus, $backendStatus, $webhookStatus)
    
    Write-Host ""
    Write-Host "=== RELATÓRIO DE TESTE ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Status dos Serviços:" -ForegroundColor White
    Write-Host "  n8n: $(if ($n8nStatus) { '✅ OK' } else { '❌ FALHOU' })" -ForegroundColor $(if ($n8nStatus) { 'Green' } else { 'Red' })
    Write-Host "  WPPConnect: $(if ($wppconnectStatus) { '✅ OK' } else { '❌ FALHOU' })" -ForegroundColor $(if ($wppconnectStatus) { 'Green' } else { 'Red' })
    Write-Host "  Backend: $(if ($backendStatus) { '✅ OK' } else { '❌ FALHOU' })" -ForegroundColor $(if ($backendStatus) { 'Green' } else { 'Red' })
    Write-Host "  Webhook: $(if ($webhookStatus) { '✅ OK' } else { '❌ FALHOU' })" -ForegroundColor $(if ($webhookStatus) { 'Green' } else { 'Red' })
    
    Write-Host ""
    Write-Host "🎯 Próximos Passos:" -ForegroundColor White
    
    if (-not $n8nStatus) {
        Write-Host "  1. Verificar se n8n está rodando: docker ps" -ForegroundColor Yellow
        Write-Host "  2. Iniciar n8n: .\setup-n8n.ps1" -ForegroundColor Yellow
    }
    
    if (-not $wppconnectStatus) {
        Write-Host "  3. Verificar se WPPConnect está rodando" -ForegroundColor Yellow
        Write-Host "  4. Conectar WhatsApp via QR Code" -ForegroundColor Yellow
    }
    
    if (-not $backendStatus) {
        Write-Host "  5. Verificar se o backend está rodando" -ForegroundColor Yellow
        Write-Host "  6. Iniciar backend: mvn spring-boot:run" -ForegroundColor Yellow
    }
    
    if (-not $webhookStatus) {
        Write-Host "  7. Verificar workflow no n8n" -ForegroundColor Yellow
        Write-Host "  8. Ativar workflow e verificar webhook" -ForegroundColor Yellow
    }
    
    if ($n8nStatus -and $wppconnectStatus -and $backendStatus -and $webhookStatus) {
        Write-Host "  ✅ Todos os serviços estão funcionando!" -ForegroundColor Green
        Write-Host "  🚀 Integração pronta para uso" -ForegroundColor Green
    }
}

# Executar testes
Write-Host "Iniciando testes de conectividade..." -ForegroundColor Yellow
Write-Host ""

$n8nStatus = Test-Connectivity -url $n8nUrl -name "n8n"
$wppconnectStatus = Test-Connectivity -url $wppconnectUrl -name "WPPConnect"
$backendStatus = Test-Connectivity -url $backendUrl -name "Backend"

Write-Host ""
Write-Host "Iniciando testes de funcionalidade..." -ForegroundColor Yellow
Write-Host ""

$webhookStatus = $false
if ($n8nStatus) {
    $webhookStatus = Test-N8nWebhook
}

if ($wppconnectStatus) {
    Test-WPPConnect | Out-Null
}

if ($backendStatus) {
    Test-Backend | Out-Null
}

# Gerar relatório
Write-Report -n8nStatus $n8nStatus -wppconnectStatus $wppconnectStatus -backendStatus $backendStatus -webhookStatus $webhookStatus

Write-Host ""
Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Green 