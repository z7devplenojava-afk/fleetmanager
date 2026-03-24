# Script para verificar status da VPS
# Execute: .\scripts\check-vps-status.ps1

$VPS_HOST = "185.225.233.18"
$VPS_USER = "root"

Write-Host "🔍 Verificando status da VPS..." -ForegroundColor Green

# Verificar se a VPS está online
Write-Host "📡 Testando conectividade..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $VPS_HOST -Count 1 -Quiet

if ($ping) {
    Write-Host "✅ VPS está online" -ForegroundColor Green
    
    # Verificar aplicação web
    Write-Host "🌐 Testando aplicação web..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://securedguard.z7botsolutions.com.br" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Aplicação web está funcionando" -ForegroundColor Green
            Write-Host "🌐 Domínio: securedguard.z7botsolutions.com.br" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Aplicação web não está respondendo" -ForegroundColor Red
        Write-Host "🔍 Tentando IP direto..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://$VPS_HOST" -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ VPS responde por IP, mas domínio pode ter problema" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ VPS não está respondendo nem por IP" -ForegroundColor Red
        }
    }
    
    # Verificar último commit (se SSH estiver configurado)
    Write-Host "📝 Para verificar último commit, execute:" -ForegroundColor Cyan
    Write-Host "ssh $VPS_USER@$VPS_HOST 'cd /opt/secured-guard && git log --oneline -1'" -ForegroundColor White
    
} else {
    Write-Host "❌ VPS não está respondendo" -ForegroundColor Red
}

Write-Host "`n📊 Para ver logs do GitHub Actions:" -ForegroundColor Cyan
Write-Host "https://github.com/zemarioramos/secured-guard/actions" -ForegroundColor White
