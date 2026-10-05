# Script para obter QR Code da Evolution API
$API_URL = "http://localhost:9000"
$API_KEY = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"
$INSTANCE_NAME = "fluxbus-whatsapp"

$headers = @{
    "apikey" = $API_KEY
}

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   OBTENDO QR CODE - EVOLUTION API" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

try {
    Write-Host "📡 Conectando à API..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$API_URL/instance/connect/$INSTANCE_NAME" -Headers $headers -Method Get
    
    if ($response.base64) {
        Write-Host "✅ QR Code obtido com sucesso!`n" -ForegroundColor Green
        
        # Salvar em arquivo HTML
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>QR Code - WhatsApp</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        img {
            max-width: 400px;
            border: 5px solid #667eea;
            border-radius: 10px;
        }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 10px;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Escaneie este QR Code</h1>
        <img src="$($response.base64)" alt="QR Code WhatsApp">
        <div class="info">
            <strong>Instância:</strong> $INSTANCE_NAME<br>
            <strong>Status:</strong> Aguardando conexão
        </div>
    </div>
</body>
</html>
"@
        
        $htmlFile = "qrcode-display.html"
        $htmlContent | Out-File -FilePath $htmlFile -Encoding UTF8
        
        Write-Host "💾 QR Code salvo em: $htmlFile" -ForegroundColor Green
        Write-Host "🌐 Abrindo no navegador..." -ForegroundColor Cyan
        
        Start-Process $htmlFile
        
        Write-Host "`n✨ Pronto! Escaneie o QR Code com seu WhatsApp`n" -ForegroundColor Green
        
    } elseif ($response.pairingCode) {
        Write-Host "📱 Código de pareamento disponível: $($response.pairingCode)`n" -ForegroundColor Yellow
        Write-Host "Digite este código no WhatsApp" -ForegroundColor Cyan
        
    } else {
        Write-Host "⚠️  QR Code ainda não disponível" -ForegroundColor Yellow
        Write-Host "Resposta da API:" -ForegroundColor Gray
        $response | ConvertTo-Json -Depth 3
        
        Write-Host "`n💡 Dica: Aguarde alguns segundos e execute o script novamente" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ Erro ao conectar à API" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`n🔍 Verificações:" -ForegroundColor Yellow
    Write-Host "1. A Evolution API está rodando? (docker-compose ps)" -ForegroundColor Gray
    Write-Host "2. A porta 9000 está acessível? (http://localhost:9000)" -ForegroundColor Gray
    Write-Host "3. A instância existe? Verifique no manager" -ForegroundColor Gray
}

Write-Host "`n════════════════════════════════════════`n" -ForegroundColor Cyan

