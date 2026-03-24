# Script para corrigir codificação do arquivo .env
$envPath = "frontend\.env"

if (Test-Path $envPath) {
    Write-Host "📄 Lendo arquivo .env com codificação UTF-16..."
    $content = Get-Content -Path $envPath -Encoding Unicode -Raw
    
    Write-Host "💾 Escrevendo arquivo .env com codificação UTF-8..."
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($envPath, $content, $utf8NoBom)
    
    Write-Host "✅ Arquivo .env convertido para UTF-8 com sucesso!"
} else {
    Write-Host "❌ Arquivo .env não encontrado em: $envPath"
}

