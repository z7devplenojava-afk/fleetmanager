# Script de Inicialização - WSL Ubuntu
# Execute: .\iniciar-wsl.ps1

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   FLUXBUS - WSL UBUNTU" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# 1. Verificar WSL
Write-Host "1️⃣ Verificando WSL Ubuntu..." -ForegroundColor Yellow
try {
    $wslStatus = wsl -d Ubuntu-22.04 -e echo "OK"
    if ($wslStatus -eq "OK") {
        Write-Host "   ✅ WSL Ubuntu disponível`n" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ WSL Ubuntu não encontrado!" -ForegroundColor Red
    Write-Host "   Execute: wsl --install Ubuntu`n" -ForegroundColor Yellow
    exit 1
}

# 2. Iniciar Docker no WSL
Write-Host "2️⃣ Iniciando Docker no WSL..." -ForegroundColor Yellow
wsl -d Ubuntu-22.04 -u root bash -c "service docker start >/dev/null 2>&1 || systemctl start docker >/dev/null 2>&1 || (nohup dockerd >/dev/null 2>&1 &)"
$dockerOk = wsl -d Ubuntu-22.04 bash -c "docker info >/dev/null 2>&1 && echo OK || echo FAIL"
if ($dockerOk -ne "OK") {
    Write-Host "   ❌ Docker não iniciou no WSL. Abra o Ubuntu e instale/inicie o Docker manualmente." -ForegroundColor Red
    Write-Host "   Ex.: sudo service docker start`n" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ Docker ativo no WSL`n" -ForegroundColor Green

# 3. Copiar docker-compose.yml para WSL
Write-Host "3️⃣ Copiando arquivos para WSL..." -ForegroundColor Yellow
wsl -d Ubuntu-22.04 bash -c "mkdir -p ~/fluxbus"
wsl -d Ubuntu-22.04 bash -c "cp /mnt/c/dev/fluxbus/docker-compose.yml ~/fluxbus/"
wsl -d Ubuntu-22.04 bash -c "cp -r /mnt/c/dev/fluxbus/whatsapp-service ~/fluxbus/ 2>/dev/null || true"
Write-Host "   ✅ Arquivos copiados`n" -ForegroundColor Green

# 4. Criar estrutura de pastas no WSL
Write-Host "4️⃣ Criando estrutura de pastas..." -ForegroundColor Yellow
wsl -d Ubuntu-22.04 bash -c "mkdir -p ~/fluxbus/backend/holerites/9-2025"
Write-Host "   ✅ Pastas criadas`n" -ForegroundColor Green

# 5. Copiar PDF de teste
Write-Host "5️⃣ Copiando PDF de teste..." -ForegroundColor Yellow
if (Test-Path "backend\holerites\9-2025\JOSE_MARIO_RAMOS_00824310608_9_2025.pdf") {
    wsl -d Ubuntu-22.04 bash -c "cp /mnt/c/dev/fluxbus/backend/holerites/9-2025/JOSE_MARIO_RAMOS_00824310608_9_2025.pdf ~/fluxbus/backend/holerites/9-2025/"
    Write-Host "   ✅ PDF copiado`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ PDF não encontrado, mas continuando...`n" -ForegroundColor Yellow
}

# 6. Criar rede Docker
Write-Host "6️⃣ Criando rede Docker no WSL..." -ForegroundColor Yellow
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker network create fluxbus 2>/dev/null || echo 'Rede já existe'"
Write-Host "   ✅ Rede pronta`n" -ForegroundColor Green

# 7. Parar containers antigos
Write-Host "7️⃣ Parando containers antigos..." -ForegroundColor Yellow
wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker compose down 2>/dev/null || true"
Write-Host "   ✅ Containers parados`n" -ForegroundColor Green

# 8. Iniciar serviços
Write-Host "8️⃣ Iniciando serviços no WSL..." -ForegroundColor Yellow
Write-Host "   (Isso pode demorar alguns minutos na primeira vez)`n" -ForegroundColor Gray

$output = wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker compose up -d 2>&1"
Write-Host $output

Write-Host "`n   ✅ Serviços iniciados!`n" -ForegroundColor Green

# 9. Aguardar inicialização
Write-Host "9️⃣ Aguardando inicialização..." -ForegroundColor Yellow
for ($i = 30; $i -gt 0; $i--) {
    Write-Host "   ⏳ $i segundos..." -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}
Write-Host "   ✅ Pronto!                    `n" -ForegroundColor Green

# 10. Verificar status
Write-Host "🔟 Verificando status..." -ForegroundColor Yellow
$containers = wsl -d Ubuntu-22.04 bash -c "cd ~/fluxbus; docker ps --format '{{.Names}} - {{.Status}}'"
Write-Host $containers
Write-Host ""

# 11. Obter QR Code
Write-Host "1️⃣1️⃣ Obtendo QR Code..." -ForegroundColor Yellow
$qrObtido = $false

for ($i = 1; $i -le 15; $i++) {
    Write-Host "   [$i/15] Tentando..." -NoNewline
    
    try {
        Invoke-WebRequest -Uri "http://localhost:3333/instance/qr" `
            -OutFile "qrcode-wsl.svg" `
            -ErrorAction Stop `
            -TimeoutSec 3 | Out-Null
        
        if ((Test-Path "qrcode-wsl.svg") -and ((Get-Item "qrcode-wsl.svg").Length -gt 100)) {
            Write-Host " ✅" -ForegroundColor Green
            $qrObtido = $true
            break
        }
    } catch {
        Write-Host " ⏳" -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds 3
}

if ($qrObtido) {
    Write-Host "`n   ✅ QR Code obtido!`n" -ForegroundColor Green
    Start-Process "qrcode-wsl.svg"
} else {
    Write-Host "`n   ⚠️ QR Code não obtido automaticamente" -ForegroundColor Yellow
    Write-Host "   Execute: .\get-qr-rapido.ps1`n" -ForegroundColor Cyan
}

# Resumo Final
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✅ TUDO INICIADO NO WSL UBUNTU!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "SERVICOS:" -ForegroundColor White
Write-Host "   Ambiente: WSL Ubuntu 22.04" -ForegroundColor Gray
Write-Host "   PostgreSQL: localhost:5433" -ForegroundColor Gray
Write-Host "   Redis: localhost:6379" -ForegroundColor Gray
Write-Host "   WhatsApp: localhost:3333" -ForegroundColor Gray

Write-Host "`nProximos Passos:" -ForegroundColor Yellow
if ($qrObtido) {
    Write-Host "   1. Escaneie o QR Code que acabou de abrir" -ForegroundColor White
    Write-Host "   2. Aguarde mensagem de conexao nos logs" -ForegroundColor White
    Write-Host "   3. Teste o envio no frontend" -ForegroundColor White
} else {
    Write-Host "   1. Execute: .\get-qr-rapido.ps1" -ForegroundColor White
    Write-Host "   2. Escaneie o QR Code" -ForegroundColor White
    Write-Host "   3. Teste o envio no frontend" -ForegroundColor White
}

Write-Host "`nComandos Uteis (WSL):" -ForegroundColor Cyan
Write-Host "   Ver logs: wsl -d Ubuntu-22.04 bash -c `"cd ~/fluxbus; docker logs -f whatsapp-service`"" -ForegroundColor Gray
Write-Host "   Status: wsl -d Ubuntu-22.04 bash -c `"cd ~/fluxbus; docker ps`"" -ForegroundColor Gray
Write-Host "   Parar: wsl -d Ubuntu-22.04 bash -c `"cd ~/fluxbus; docker compose down`"" -ForegroundColor Gray

Write-Host "`n----------------------------------------`n" -ForegroundColor Cyan

