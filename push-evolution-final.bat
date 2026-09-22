@echo off
echo ========================================
echo   PUSH EVOLUTION API + CORRECOES
echo ========================================
echo.

echo Adicionando arquivos...

git add docker-compose.yml
git add docker-compose.ci.yml
git add backend/src/main/resources/application-ci.properties
git add backend/src/test/java/com/z7design/fluxbus/service/EnvioServiceTest.java
git add evolution-api/Dockerfile
git add evolution-portainer-stack.yml
git add GUIA_PORTAINER_EVOLUTION.md
git add INSTALAR_EVOLUTION_PORTAINER.md
git add EXECUTAR_PORTAINER_AGORA.md
git add testar-evolution-portainer.ps1
git add build-e-testar-evolution.bat
git add testar-evolution-local.bat
git add CORRECAO_PUPPETEER_EVOLUTION.md
git add SOLUCOES_EVOLUTION_API.md
git add DECISAO_FINAL_WHATSAPP.md
git add diagnosticar-evolution-ci.sh
git add deploy-evolution-ci-completo.sh
git add verificar-logs-evolution-ci.sh

echo OK
echo.

echo Fazendo commit...

git commit -m "feat: Evolution API completa + Correcoes 405 + Guia Portainer" -m "EVOLUTION API:" -m "- Stack completa para Portainer (Evolution + Redis)" -m "- Dockerfile customizado com Chromium instalado" -m "- Configuracoes para CI e local" -m "- Suporte Puppeteer/Chromium (shm_size, security_opt)" -m "- Cache Redis configurado" -m "" -m "CORRECAO 405:" -m "- Middlewares Traefik corrigidos" -m "- CORS headers completos" -m "- Login funcionando no CI" -m "" -m "TESTES:" -m "- Teste EnvioService corrigido" -m "- Removidas referencias a baileysRestService" -m "" -m "DOCUMENTACAO:" -m "- GUIA_PORTAINER_EVOLUTION.md" -m "- INSTALAR_EVOLUTION_PORTAINER.md" -m "- EXECUTAR_PORTAINER_AGORA.md" -m "- DECISAO_FINAL_WHATSAPP.md" -m "- Scripts de teste e diagnostico"

echo OK
echo.

echo Fazendo push para origin ci...

git push origin ci

echo.
echo ========================================
echo   PUSH CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Acesse: https://portainer2.z7botsolutions.com.br
echo 2. Crie stack com evolution-portainer-stack.yml
echo 3. Execute: testar-evolution-portainer.ps1
echo.
pause

