# Script para obter QR Code da Evolution API com auto-retry
param(
    [string]$InstanceName = "test-qr",
    [int]$MaxAttempts = 30,
    [int]$DelaySeconds = 3
)

$API_URL = "http://localhost:9000"
$API_KEY = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"

$headers = @{
    "apikey" = $API_KEY
}

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   AUTO QR CODE GETTER" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📱 Instância: $InstanceName" -ForegroundColor White
Write-Host "🔄 Tentativas: $MaxAttempts" -ForegroundColor White
Write-Host "⏱️  Intervalo: $DelaySeconds segundos`n" -ForegroundColor White

for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
        Write-Host "[$i/$MaxAttempts] Tentando obter QR Code..." -ForegroundColor Yellow -NoNewline
        
        $response = Invoke-RestMethod -Uri "$API_URL/instance/connect/$InstanceName" `
            -Headers $headers `
            -ErrorAction Stop
        
        if ($response.base64 -and $response.base64.Length -gt 100) {
            Write-Host " ✅ SUCESSO!" -ForegroundColor Green
            
            # Salvar em HTML
            $html = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>QR Code WhatsApp - $InstanceName</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea, #764ba2);
            font-family: Arial, sans-serif;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 30px 80px rgba(0,0,0,0.4);
            max-width: 600px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        .qrcode {
            margin: 30px 0;
        }
        .qrcode img {
            max-width: 400px;
            border: 8px solid #667eea;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .info {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .info p {
            margin: 10px 0;
            color: #666;
        }
        .success {
            color: #00b894;
            font-weight: bold;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>📱 QR Code WhatsApp</h1>
        <p class='success'>✅ QR Code Gerado com Sucesso!</p>
        
        <div class='qrcode'>
            <img src='$($response.base64)' alt='QR Code'/>
        </div>
        
        <div class='info'>
            <p><strong>Instância:</strong> $InstanceName</p>
            <p><strong>API:</strong> Evolution v1.7.5</p>
            <p><strong>Ambiente:</strong> WSL Ubuntu</p>
            <p style='margin-top: 15px; font-size: 14px;'>
                Abra o WhatsApp no celular → Dispositivos Conectados → Conectar dispositivo
            </p>
        </div>
    </div>
</body>
</html>
"@
            
            $filename = "qrcode-$InstanceName-$(Get-Date -Format 'HHmmss').html"
            $html | Out-File -FilePath $filename -Encoding UTF8
            
            Write-Host "`n✅ QR Code salvo em: $filename" -ForegroundColor Green
            Write-Host "🌐 Abrindo no navegador..." -ForegroundColor Cyan
            
            Start-Process $filename
            
            Write-Host "`n════════════════════════════════════════" -ForegroundColor Green
            Write-Host "   ✅ SUCESSO! Escaneie o QR Code" -ForegroundColor Green
            Write-Host "════════════════════════════════════════`n" -ForegroundColor Green
            
            return
        }
        else {
            Write-Host " ⏳ Aguardando..." -ForegroundColor Gray
        }
    }
    catch {
        Write-Host " ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    if ($i -lt $MaxAttempts) {
        Start-Sleep -Seconds $DelaySeconds
    }
}

Write-Host "`n════════════════════════════════════════" -ForegroundColor Red
Write-Host "   ❌ TIMEOUT - QR Code não gerado" -ForegroundColor Red
Write-Host "════════════════════════════════════════`n" -ForegroundColor Red

Write-Host "💡 Tente:" -ForegroundColor Yellow
Write-Host "  1. Usar o Manager: http://localhost:9000/manager" -ForegroundColor White
Write-Host "  2. Reiniciar a instância" -ForegroundColor White
Write-Host "  3. Executar este script novamente`n" -ForegroundColor White

