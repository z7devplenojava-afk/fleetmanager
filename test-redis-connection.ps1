# Script para testar conexão com Redis
Write-Host "🔍 Testando conexão com Redis..." -ForegroundColor Cyan

# Testar via Docker
Write-Host "`n1. Testando Redis via Docker container..." -ForegroundColor Yellow
try {
    $result = docker exec redis redis-cli ping 2>&1
    if ($result -eq "PONG") {
        Write-Host "✅ Redis está respondendo via Docker!" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis não está respondendo: $result" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao conectar ao Redis: $_" -ForegroundColor Red
}

# Testar via localhost (se tiver redis-cli instalado)
Write-Host "`n2. Testando Redis via localhost:6379..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 6379)
    if ($tcpClient.Connected) {
        Write-Host "✅ Porta 6379 está acessível!" -ForegroundColor Green
        $tcpClient.Close()
    }
} catch {
    Write-Host "⚠️ Não foi possível conectar na porta 6379: $_" -ForegroundColor Yellow
    Write-Host "   (Isso é normal se redis-cli não estiver instalado no Windows)" -ForegroundColor Gray
}

Write-Host "`n✅ Teste concluído!" -ForegroundColor Cyan

