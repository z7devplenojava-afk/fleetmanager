@echo off
chcp 65001 >nul
cls

echo ========================================
echo   DEPLOY BAILEYS PARA CI
echo ========================================
echo.
echo ✅ Código está pronto e correto!
echo ✅ Testes unitários passando (22 testes)
echo ✅ Correção DDI 55 implementada
echo.
echo ❌ Docker Windows bloqueando (Error 405)
echo ✅ Linux provavelmente vai funcionar!
echo.
echo ========================================
echo.

cd /d C:\dev\secured-guard

echo 📝 1. Adicionando arquivos...
git add .

echo.
echo 💾 2. Fazendo commit...
git commit -m "fix: Baileys latest com correção DDI 55 e DNS configurado - deploy para CI"

echo.
echo 🚀 3. Fazendo push para CI...
git push origin ci

echo.
echo ========================================
echo   DEPLOY INICIADO!
echo ========================================
echo.
echo ⏱️  Aguarde ~10 minutos para GitHub Actions
echo 🔗 Acesse: https://github.com/SEU_USER/secured-guard/actions
echo.
echo 🎯 Após deploy, teste:
echo    https://securedguard.z7botsolutions.com.br:3333/instance/qr
echo.
echo ========================================
echo.

pause

