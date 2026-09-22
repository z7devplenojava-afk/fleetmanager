# ========================================
# TESTE EVOLUTION API VIA PORTAINER
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTANDO EVOLUTION API (PORTAINER)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$API_KEY = "B6D711FCDE4D4FD5936544120E713976"
$BASE_URL = "http://185.225.233.18:9000"
$INSTANCE = "fluxbus"

# Testar API
Write-Host "1. Testando se API está online..." -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "$BASE_URL" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Evolution API v$($test.version) ONLINE!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Evolution API OFFLINE!" -ForegroundColor Red
    Write-Host "   Erro: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Verifique se a stack foi criada no Portainer!" -ForegroundColor Cyan
    exit 1
}
Write-Host ""

# Deletar instância antiga (se existir)
Write-Host "2. Deletando instância antiga (se existir)..." -ForegroundColor Yellow
try {
    $headers = @{ apikey = $API_KEY }
    Invoke-RestMethod -Uri "$BASE_URL/instance/delete/$INSTANCE" -Method DELETE -Headers $headers -ErrorAction SilentlyContinue | Out-Null
    Write-Host "   ✅ Instância antiga deletada" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Sem instância antiga" -ForegroundColor Yellow
}
Write-Host ""

# Aguardar
Write-Host "3. Aguardando 5 segundos..." -ForegroundColor Yellow
Start-Sleep 5
Write-Host ""

# Criar nova instância
Write-Host "4. Criando nova instância..." -ForegroundColor Yellow
$headers = @{ apikey = $API_KEY }
$body = @{
    instanceName = $INSTANCE
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

try {
    $create = Invoke-RestMethod -Uri "$BASE_URL/instance/create" -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "   ✅ Instância criada!" -ForegroundColor Green
    Write-Host "   Hash: $($create.hash)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Erro ao criar instância: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Aguardar inicialização
Write-Host "5. Aguardando 25 segundos para inicializar..." -ForegroundColor Yellow
for ($i = 1; $i -le 25; $i++) {
    if ($i % 5 -eq 0) {
        Write-Host "   [$i/25s]" -ForegroundColor Cyan
    }
    Start-Sleep 1
}
Write-Host ""

# Obter QR Code
Write-Host "6. Obtendo QR Code..." -ForegroundColor Yellow
try {
    $qr = Invoke-RestMethod -Uri "$BASE_URL/instance/connect/$INSTANCE" -Method GET -Headers $headers
    
    if ($qr.code -and $qr.code.length -gt 100) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ QR CODE GERADO COM SUCESSO!" -ForegroundColor Green -BackgroundColor DarkGreen
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "QR Code: $($qr.code.length) caracteres" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "  📱 ACESSE PARA ESCANEAR:" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "http://185.225.233.18:9000/instance/connect/$INSTANCE" -ForegroundColor White -BackgroundColor Blue
        Write-Host ""
        Write-Host "Ou via SSL:" -ForegroundColor Cyan
        Write-Host "https://evolution.z7botsolutions.com.br/instance/connect/$INSTANCE" -ForegroundColor White
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  🔑 IMPORTANTE:" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Para acessar via navegador, instale a extensão ModHeader" -ForegroundColor White
        Write-Host "e adicione o header:" -ForegroundColor White
        Write-Host ""
        Write-Host "  Header: apikey" -ForegroundColor Yellow
        Write-Host "  Value:  $API_KEY" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Depois escaneie com WhatsApp: 31971731747" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ EVOLUTION API FUNCIONANDO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  ❌ QR CODE VAZIO" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "QR Code: $($qr.code.length) caracteres" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "DIAGNÓSTICO:" -ForegroundColor Cyan
        Write-Host "O loop de ChannelStartupService ainda persiste." -ForegroundColor White
        Write-Host "Este é um bug da Evolution API v2.1.x" -ForegroundColor White
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "  💡 SOLUÇÃO:" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Use Meta Cloud API (já está configurada!):" -ForegroundColor White
        Write-Host ""
        Write-Host "1. Edite: backend/src/main/resources/application-ci.properties" -ForegroundColor Cyan
        Write-Host "2. Mude: whatsapp.provider=meta" -ForegroundColor Cyan
        Write-Host "3. Faça push para CI" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Meta Cloud API:" -ForegroundColor Green
        Write-Host "  - ✅ API oficial WhatsApp" -ForegroundColor White
        Write-Host "  - ✅ SEM bugs ou loops" -ForegroundColor White
        Write-Host "  - ✅ 1.000 conversas grátis/mês" -ForegroundColor White
        Write-Host ""
    }
    
} catch {
    Write-Host "   ❌ Erro ao obter QR Code: $_" -ForegroundColor Red
}

Write-Host ""

