# QR Code Auto-Pooling Simples
$API_URL = "http://localhost:9000"
$API_KEY = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"
$INSTANCE = "test-qr"

$headers = @{"apikey" = $API_KEY}

Write-Host "`n🔄 Fazendo pooling do QR Code..." -ForegroundColor Cyan
Write-Host "📱 Instância: $INSTANCE`n" -ForegroundColor White

for ($i = 1; $i -le 40; $i++) {
    Write-Host "[$i/40] Tentando..." -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/instance/connect/$INSTANCE" -Headers $headers -ErrorAction Stop
        
        if ($response.base64 -and $response.base64.StartsWith("data:image")) {
            Write-Host " ✅ SUCESSO!`n" -ForegroundColor Green
            
            # Criar HTML simples
            $html = "<html><head><meta charset='UTF-8'><title>QR Code</title></head>"
            $html += "<body style='display:flex;justify-content:center;align-items:center;min-height:100vh;background:#667eea;margin:0;'>"
            $html += "<div style='background:white;padding:50px;border-radius:20px;text-align:center;'>"
            $html += "<h1 style='color:#333;'>📱 Escaneie com WhatsApp</h1>"
            $html += "<img src='$($response.base64)' style='border:8px solid #667eea;border-radius:15px;max-width:400px;'/>"
            $html += "<p style='margin-top:20px;color:#666;'><strong>Instância:</strong> $INSTANCE</p>"
            $html += "</div></body></html>"
            
            $file = "qrcode-ready.html"
            $html | Out-File -FilePath $file -Encoding UTF8
            
            Write-Host "✅ Salvo em: $file" -ForegroundColor Green
            Start-Process $file
            
            Write-Host "`n🎉 QR Code aberto no navegador!`n" -ForegroundColor Green
            return
        }
        else {
            Write-Host " ⏳" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`n❌ Timeout - QR Code não gerado após 80 segundos" -ForegroundColor Red
Write-Host "💡 Use o Manager: http://localhost:9000/manager`n" -ForegroundColor Yellow

