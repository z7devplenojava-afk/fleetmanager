# Teste de Integração WhatsApp - FluxBus
# Este script testa a integração com WPPConnect, Baileys e Twilio

param(
    [string]$Provider = "wppconnect",
    [string]$PhoneNumber = "5511999999999",
    [string]$Message = "Teste de integração WhatsApp - FluxBus",
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Token = ""
)

Write-Host "📱 Teste de Integração WhatsApp - $Provider" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Função para fazer requisição HTTP
function Invoke-TestRequest {
    param(
        [string]$Url,
        [string]$Method = "POST",
        [string]$Body = "",
        [hashtable]$Headers = @{}
    )
    
    try {
        $headers["Content-Type"] = "application/json"
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $Body -Headers $Headers
        return $response
    }
    catch {
        Write-Host "❌ Erro na requisição: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Teste 1: Verificar conexão WhatsApp
Write-Host "`n🔍 Teste 1: Verificando conexão WhatsApp..." -ForegroundColor Yellow

$checkUrl = "$BaseUrl/api/envio/verificar-whatsapp"
$checkBody = @{
    provider = $Provider
} | ConvertTo-Json

$checkResponse = Invoke-TestRequest -Url $checkUrl -Body $checkBody

if ($checkResponse) {
    Write-Host "✅ Conexão WhatsApp: $($checkResponse.conectado)" -ForegroundColor Green
} else {
    Write-Host "❌ Falha ao verificar conexão" -ForegroundColor Red
}

# Teste 2: Enviar mensagem de teste
Write-Host "`n📤 Teste 2: Enviando mensagem de teste..." -ForegroundColor Yellow

$testUrl = "$BaseUrl/api/envio/teste-whatsapp"
$testBody = @{
    telefone = $PhoneNumber
    provedor = $Provider
} | ConvertTo-Json

$testResponse = Invoke-TestRequest -Url $testUrl -Body $testBody

if ($testResponse) {
    Write-Host "✅ Mensagem de teste enviada: $($testResponse.enviado)" -ForegroundColor Green
    Write-Host "📝 Resposta: $($testResponse.mensagem)" -ForegroundColor Gray
} else {
    Write-Host "❌ Falha ao enviar mensagem de teste" -ForegroundColor Red
}

# Teste 3: Enviar holerite (se PDF existir)
Write-Host "`n📄 Teste 3: Enviando holerite..." -ForegroundColor Yellow

$pdfPath = "backend/payslips_output/ELAINE_APARECIDA_SOARES_PEREIRA_Porteiro_07349527675_Anterior_2025.pdf"
if (Test-Path $pdfPath) {
    $holeriteUrl = "$BaseUrl/api/envio/enviar-holerite"
    $holeriteBody = @{
        telefone = $PhoneNumber
        nomeFuncionario = "Funcionário Teste"
        caminhoPDF = $pdfPath
        provedor = $Provider
    } | ConvertTo-Json
    
    $holeriteResponse = Invoke-TestRequest -Url $holeriteUrl -Body $holeriteBody
    
    if ($holeriteResponse) {
        Write-Host "✅ Holerite enviado: $($holeriteResponse.enviado)" -ForegroundColor Green
        Write-Host "📝 Resposta: $($holeriteResponse.mensagem)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Falha ao enviar holerite" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ PDF de teste não encontrado: $pdfPath" -ForegroundColor Yellow
}

# Teste 4: Verificar status dos serviços
Write-Host "`n🔧 Teste 4: Verificando status dos serviços..." -ForegroundColor Yellow

# Verificar WPPConnect
try {
    $wppconnectStatus = Invoke-RestMethod -Uri "http://localhost:8080/api/status" -Method GET
    Write-Host "✅ WPPConnect: $($wppconnectStatus.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ WPPConnect: Não está rodando" -ForegroundColor Red
}

# Verificar Baileys
try {
    $baileysStatus = Invoke-RestMethod -Uri "http://localhost:3000/status" -Method GET
    Write-Host "✅ Baileys: $($baileysStatus.connected)" -ForegroundColor Green
} catch {
    Write-Host "❌ Baileys: Não está rodando" -ForegroundColor Red
}

# Verificar n8n
try {
    $n8nStatus = Invoke-RestMethod -Uri "http://localhost:5678/healthz" -Method GET
    Write-Host "✅ n8n: Rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n: Não está rodando" -ForegroundColor Red
}

Write-Host "`n📊 Resumo dos Testes:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "Provedor: $Provider" -ForegroundColor White
Write-Host "Telefone: $PhoneNumber" -ForegroundColor White
Write-Host "URL Base: $BaseUrl" -ForegroundColor White

Write-Host "`n🎯 Próximos Passos:" -ForegroundColor Green
Write-Host "1. Verifique se o WhatsApp está conectado no provedor escolhido" -ForegroundColor White
Write-Host "2. Confirme se o número de telefone está correto" -ForegroundColor White
Write-Host "3. Teste com um número real" -ForegroundColor White
Write-Host "4. Configure o envio automático de holerites" -ForegroundColor White

Write-Host "`n✅ Teste concluído!" -ForegroundColor Green 