@echo off
chcp 65001 >nul
cls

echo ========================================
echo   CORRIGINDO ERRO 405 NO CI
echo ========================================
echo.
echo 🔴 Problema: 405 Not Allowed em /auth/login
echo ✅ Solução: Atualizar configuração Traefik
echo.
echo ========================================
echo.

cd /d C:\dev\secured-guard

echo 📝 1. Adicionando arquivos...
git add docker-compose.ci.yml CORRIGIR_405_CI_AGORA.md

echo.
echo 💾 2. Fazendo commit...
git commit -m "fix: adiciona prioridade ao router Traefik para corrigir 405 no CI"

echo.
echo 🚀 3. Fazendo push para CI...
git push origin ci

echo.
echo ========================================
echo   CORREÇÃO ENVIADA!
echo ========================================
echo.
echo ⏱️  Aguarde ~5 minutos para GitHub Actions
echo.
echo 🧪 Teste depois:
echo    https://ci.z7botsolutions.com.br/api/health
echo    Login no frontend
echo.
echo ========================================
echo.

pause

