# Script para configurar e iniciar o n8n para integração WhatsApp
# Autor: Sistema SecuredGuard
# Data: 2024

Write-Host "=== CONFIGURAÇÃO N8N PARA WHATSAPP ===" -ForegroundColor Green
Write-Host ""

# Verificar se Docker está instalado
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker não encontrado. Instale o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se Docker está rodando
Write-Host "Verificando se Docker está rodando..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker não está rodando. Inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Criar diretório para dados do n8n
$n8nDataDir = "C:\n8n-data"
if (!(Test-Path $n8nDataDir)) {
    Write-Host "Criando diretório de dados do n8n: $n8nDataDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $n8nDataDir -Force | Out-Null
}

# Criar arquivo docker-compose para n8n
$dockerComposeContent = @"
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: securedguard-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=securedguard2024
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_USER_MANAGEMENT_DISABLED=false
      - N8N_WEBHOOK_URL=http://localhost:5678/
      - N8N_ENCRYPTION_KEY=your-secret-key-here
      - WEBHOOK_TUNNEL_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - ${n8nDataDir}:/home/node/.n8n
      - ./n8n-workflows:/home/node/.n8n/workflows
    networks:
      - n8n-network

  wppconnect:
    image: wppconnect/wppconnect:latest
    container_name: securedguard-wppconnect
    restart: unless-stopped
    ports:
      - "21465:21465"
    environment:
      - WPPCONNECT_SERVER_PORT=21465
      - WPPCONNECT_SERVER_HOST=0.0.0.0
      - WPPCONNECT_SERVER_SECRET=securedguard-secret
      - WPPCONNECT_SERVER_TOKEN=securedguard-token
    volumes:
      - wppconnect-data:/home/node/.wppconnect
    networks:
      - n8n-network

  baileys:
    image: baileys-whatsapp:latest
    container_name: securedguard-baileys
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - BAILEYS_PORT=3000
      - BAILEYS_HOST=0.0.0.0
    volumes:
      - baileys-data:/app/data
    networks:
      - n8n-network

networks:
  n8n-network:
    driver: bridge

volumes:
  wppconnect-data:
  baileys-data:
"@

$dockerComposePath = "docker-compose-n8n.yml"
Write-Host "Criando arquivo docker-compose: $dockerComposePath" -ForegroundColor Yellow
$dockerComposeContent | Out-File -FilePath $dockerComposePath -Encoding UTF8

# Parar containers existentes
Write-Host "Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f $dockerComposePath down 2>$null

# Iniciar n8n
Write-Host "Iniciando n8n..." -ForegroundColor Yellow
docker-compose -f $dockerComposePath up -d

# Aguardar n8n inicializar
Write-Host "Aguardando n8n inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar se n8n está rodando
Write-Host "Verificando status do n8n..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ n8n está rodando em http://localhost:5678" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ n8n pode estar ainda inicializando. Aguarde alguns minutos." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== CONFIGURAÇÃO COMPLETA ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Acesse http://localhost:5678" -ForegroundColor White
Write-Host "2. Login: admin / securedguard2024" -ForegroundColor White
Write-Host "3. Importe o workflow: n8n-workflows/whatsapp-envio-holerites.json" -ForegroundColor White
Write-Host "4. Configure as credenciais dos provedores WhatsApp" -ForegroundColor White
Write-Host "5. Ative o workflow" -ForegroundColor White
Write-Host ""
Write-Host "🔧 CONFIGURAÇÕES DO BACKEND:" -ForegroundColor Cyan
Write-Host "As configurações já estão em application-dev.properties" -ForegroundColor White
Write-Host "Webhook URL: http://localhost:5678/webhook/whatsapp" -ForegroundColor White
Write-Host ""
Write-Host "📱 PROVEDORES SUPORTADOS:" -ForegroundColor Cyan
Write-Host "- WPPConnect: http://localhost:21465" -ForegroundColor White
Write-Host "- Baileys: http://localhost:3000" -ForegroundColor White
Write-Host "- Twilio: Configurar credenciais no n8n" -ForegroundColor White
Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green 