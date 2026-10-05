@echo off
echo ========================================
echo   CORRIGINDO TESTE E FAZENDO PUSH
echo ========================================
echo.

git add backend\src\test\java\com\z7design\fluxbus\service\EnvioServiceTest.java
git add deploy-evolution-ci-completo.sh
git add COMO_EXECUTAR_NO_CI.md

git commit -m "fix: Remover referencias a baileysRestService no teste + scripts deploy" -m "O EnvioService nao recebe mais baileysRestService no construtor." -m "Removidas verificacoes desnecessarias do teste." -m "Adicionados scripts completos de deploy Evolution API."

git push origin ci

echo.
echo ========================================
echo   PUSH CONCLUIDO!
echo ========================================
echo.
echo GitHub Actions vai rodar novamente e deve passar!
echo.
pause

