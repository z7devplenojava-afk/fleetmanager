@echo off
echo ========================================
echo   SOLUCAO 1: DESABILITAR REDIS
echo ========================================
echo.

git add docker-compose.ci.yml
git add diagnosticar-evolution-ci.sh
git add SOLUCOES_EVOLUTION_API.md

git commit -m "fix: Desabilitar Redis da Evolution API (causa de loop)" -m "Cache Redis esta causando loop infinito no ChannelStartupService." -m "Mudando para CACHE_LOCAL_ENABLED=true para resolver o problema." -m "Removida dependencia redis-ci do evolution-api-ci."

git push origin ci

echo.
echo ========================================
echo   PUSH CONCLUIDO!
echo ========================================
echo.
echo GitHub Actions vai fazer deploy automatico.
echo Aguarde ~10 minutos e teste novamente:
echo   http://185.225.233.18:9000/instance/connect/fluxbus
echo.
pause

