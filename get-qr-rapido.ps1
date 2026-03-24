# Obter QR Code Rapidamente
Write-Host "`n📱 Obtendo QR Code do WhatsApp...`n" -ForegroundColor Cyan

$tentativas = 20
$obtido = $false

for ($i = 1; $i -le $tentativas; $i++) {
    Write-Host "[$i/$tentativas] Tentando..." -NoNewline
    
    try {
        Invoke-WebRequest -Uri "http://localhost:3333/instance/qr" `
            -OutFile "qrcode-atual.svg" `
            -ErrorAction Stop `
            -TimeoutSec 3 | Out-Null
        
        if (Test-Path "qrcode-atual.svg") {
            $size = (Get-Item "qrcode-atual.svg").Length
            if ($size -gt 100) {
                Write-Host " ✅ QR Code obtido!" -ForegroundColor Green
                $obtido = $true
                break
            }
        }
    } catch {
        Write-Host " ⏳" -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds 2
}

if ($obtido) {
    Write-Host "`n✅ QR Code salvo em: qrcode-atual.svg" -ForegroundColor Green
    Write-Host "🌐 Abrindo no navegador...`n" -ForegroundColor Cyan
    Start-Process "qrcode-atual.svg"
    
    Write-Host "📱 Escaneie o QR Code com seu WhatsApp!" -ForegroundColor Yellow
    Write-Host "⏳ Aguarde a mensagem 'WhatsApp connected and ready!' nos logs`n" -ForegroundColor White
} else {
    Write-Host "`n❌ QR Code não disponível" -ForegroundColor Red
    Write-Host "💡 Aguarde mais alguns segundos e execute novamente`n" -ForegroundColor Yellow
}

