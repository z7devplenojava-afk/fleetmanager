@echo off
echo ========================================
echo   FAZENDO PUSH PARA CI
echo ========================================
echo.

echo 1. Adicionando arquivos...
git add docker-compose.ci.yml
git add backend\src\main\resources\application-ci.properties
git add deploy-evolution-ci.sh
git add DEPLOY_EVOLUTION_CI.md
git add EXECUTAR_DEPLOY_CI_AGORA.md
git add push-ci-agora.bat
echo    OK
echo.

echo 2. Fazendo commit...
git commit -m "feat: Evolution API + Correcao erro 405 login no CI" -m "EVOLUTION API:" -m "- Adicionar servico evolution-api-ci ao docker-compose.ci.yml" -m "- Configurar Evolution API com PostgreSQL e Redis" -m "- Expor via Traefik em evolution.z7botsolutions.com.br" -m "- Criar documentacao completa" -m "" -m "CORRECAO 405:" -m "- Corrigir middlewares Traefik do backend-ci" -m "- Adicionar CORS headers completos" -m "- Resolver erro 405 Not Allowed no /auth/login"
echo    OK
echo.

echo 3. Fazendo push para origin ci...
git push origin ci
echo    OK
echo.

echo ========================================
echo   PUSH CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Conectar ao servidor CI via SSH
echo 2. Ver instrucoes em EXECUTAR_DEPLOY_CI_AGORA.md
echo.
pause

