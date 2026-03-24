# ========================================
# Script PowerShell para corrigir erro 405 no CI
# ========================================

Write-Host "🚀 Iniciando correção do erro 405 no CI..." -ForegroundColor Cyan
Write-Host ""

# 1. Commit local
Write-Host "📝 Fazendo commit das mudanças..." -ForegroundColor Yellow
try {
    git add docker-compose.ci.yml CORRECAO_TRAEFIK_405_CI.md deploy-fix-405-ci.sh deploy-fix-405-ci.ps1
    git commit -m "fix: Corrigir erro 405 no CI - adicionar middlewares Traefik para CORS"
    Write-Host "✅ Commit realizado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Nada para commitar ou commit já feito" -ForegroundColor Yellow
}

# 2. Push para branch CI
Write-Host ""
Write-Host "📤 Fazendo push para o branch CI..." -ForegroundColor Yellow
try {
    git push origin ci
    Write-Host "✅ Push realizado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Push falhou, verifique se tem mudanças ou se precisa de pull primeiro" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Commit e push concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔧 PRÓXIMOS PASSOS (EXECUTAR NO SERVIDOR CI):" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh usuario@seu-servidor-ci" -ForegroundColor White
Write-Host "cd /var/www/secured_guard/ci" -ForegroundColor White
Write-Host "git pull origin ci" -ForegroundColor White
Write-Host "docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci" -ForegroundColor White
Write-Host "docker-compose -f docker-compose.ci.yml logs -f backend-ci" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Depois teste o login em: " -NoNewline -ForegroundColor Yellow
Write-Host "https://ci.z7botsolutions.com.br" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Dica: Se você tem acesso SSH configurado, posso criar um script para fazer o deploy remoto automaticamente!" -ForegroundColor Cyan

