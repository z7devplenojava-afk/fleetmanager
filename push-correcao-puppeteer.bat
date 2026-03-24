@echo off
echo ========================================
echo   CORRECAO: PUPPETEER/CHROMIUM
echo ========================================
echo.

echo O que foi corrigido:
echo   1. Desabilitado Redis (causa de loop)
echo   2. Habilitado cache local
echo   3. Adicionado shm_size (memoria para Chromium)
echo   4. Adicionado security_opt (sandbox Chromium)
echo   5. Configurado variaveis Puppeteer
echo.

git add docker-compose.ci.yml
git add CORRECAO_PUPPETEER_EVOLUTION.md
git add diagnosticar-evolution-ci.sh
git add SOLUCOES_EVOLUTION_API.md

git commit -m "fix: Adicionar suporte Puppeteer/Chromium na Evolution API" -m "PROBLEMA:" -m "QR Code nao gerado porque Puppeteer falha ao iniciar" -m "" -m "SOLUCOES:" -m "- Desabilitar Redis (causa de loop)" -m "- Adicionar shm_size: 512mb (memoria compartilhada)" -m "- Adicionar security_opt: seccomp=unconfined (sandbox)" -m "- Configurar PUPPETEER_EXECUTABLE_PATH" -m "- Habilitar CACHE_LOCAL_ENABLED"

git push origin ci

echo.
echo ========================================
echo   PUSH CONCLUIDO!
echo ========================================
echo.
echo GitHub Actions vai fazer deploy (~10 min)
echo.
echo Apos o deploy, teste:
echo   curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
echo     http://185.225.233.18:9000/instance/connect/securedguard
echo.
pause

