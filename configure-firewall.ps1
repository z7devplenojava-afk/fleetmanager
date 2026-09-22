# Script para configurar firewall do Windows para permitir acesso ao FluxBus
# Execute este script como Administrador

Write-Host "Configurando Firewall do Windows para FluxBus..." -ForegroundColor Green

# Regra para Backend (porta 8083)
Write-Host "Criando regra para Backend (porta 8083)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="FluxBus Backend" dir=in action=allow protocol=TCP localport=8083

# Regra para Frontend (porta 3000)
Write-Host "Criando regra para Frontend (porta 3000)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="FluxBus Frontend" dir=in action=allow protocol=TCP localport=3000

Write-Host "`nRegras de firewall criadas com sucesso!" -ForegroundColor Green
Write-Host "`nVocê pode acessar o sistema de outros computadores usando:" -ForegroundColor Cyan
Write-Host "  Frontend: http://192.168.1.116:3000" -ForegroundColor White
Write-Host "  Backend:  http://192.168.1.116:8083" -ForegroundColor White
Write-Host "`nPara verificar as regras criadas, execute:" -ForegroundColor Yellow
Write-Host "  netsh advfirewall firewall show rule name=`"FluxBus Backend`"" -ForegroundColor Gray
Write-Host "  netsh advfirewall firewall show rule name=`"FluxBus Frontend`"" -ForegroundColor Gray
























