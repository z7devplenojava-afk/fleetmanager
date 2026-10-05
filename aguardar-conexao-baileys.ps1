# Verificar conexão Baileys e executar teste

Write-Host ""
Write-Host "Aguardando conexão do Baileys..." -ForegroundColor Yellow
Write-Host ""

for ($i = 1; $i -le 30; $i++) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3333/health" -Method GET -TimeoutSec 2
        
        if ($health.ready -and $health.connected) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  ✅ BAILEYS CONECTADO!" -ForegroundColor Green -BackgroundColor DarkGreen
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            
            # Executar teste DDI
            Write-Host "Executando teste DDI 55..." -ForegroundColor Cyan
            Write-Host ""
            
            # Teste COM DDI
            Write-Host "Enviando mensagem COM DDI 55 para 31997142303..." -ForegroundColor Yellow
            $body = @{
                id = "5531997142303"
                message = "🧪 TESTE COM DDI 55 - Deve chegar neste número!"
            } | ConvertTo-Json
            
            try {
                Invoke-RestMethod -Uri "http://localhost:3333/message/text" -Method POST -Body $body -ContentType "application/json" | Out-Null
                Write-Host "✅ Mensagem enviada!" -ForegroundColor Green
            } catch {
                Write-Host "❌ Erro: $_" -ForegroundColor Red
            }
            
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "  VALIDAÇÃO:" -ForegroundColor Cyan
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Verifique nos WhatsApp:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "📱 31997142303 (destinatário):" -ForegroundColor Green
            Write-Host "   Deve receber: TESTE COM DDI 55" -ForegroundColor White
            Write-Host ""
            Write-Host "📱 31971731747 (conectado):" -ForegroundColor Cyan
            Write-Host "   NÃO deve receber nada (se receber = ainda com bug)" -ForegroundColor White
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Yellow
            Write-Host "  RESULTADO?" -ForegroundColor Yellow
            Write-Host "========================================" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "✅ Chegou em 31997142303? = SOLUÇÃO FUNCIONA!" -ForegroundColor Green
            Write-Host "❌ Chegou em 31971731747? = Ainda com problema" -ForegroundColor Red
            Write-Host ""
            
            exit 0
        }
        
        Write-Host "." -NoNewline -ForegroundColor Cyan
        Start-Sleep 2
        
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Red
        Start-Sleep 2
    }
}

Write-Host ""
Write-Host ""
Write-Host "⏱️ Timeout - Baileys não conectou em 60 segundos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Acesse: http://localhost:3333/qrcode?key=fluxbus" -ForegroundColor Cyan
Write-Host "E escaneie com WhatsApp: 31971731747" -ForegroundColor Yellow
Write-Host ""

