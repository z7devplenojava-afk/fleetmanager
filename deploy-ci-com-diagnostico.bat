@echo off
:: ====================================================
:: Deploy CI com Diagnóstico Automático
:: ====================================================

echo.
echo ================================================
echo  DEPLOY CI COM DIAGNOSTICO AUTOMATICO
echo ================================================
echo.

echo [1/4] Verificando status do Git...
git status
if errorlevel 1 (
    echo ERRO: Git nao encontrado!
    pause
    exit /b 1
)

echo.
echo [2/4] Adicionando arquivos modificados...
git add .
git add -A

echo.
echo [3/4] Criando commit...
git commit -m "Adicionar WhatsApp Service e diagnostico automatico ao CI"

echo.
echo [4/4] Enviando para branch ci...
git push origin ci

echo.
echo ================================================
echo  DEPLOY INICIADO!
echo ================================================
echo.
echo Acompanhe o progresso em:
echo https://github.com/SEU_USUARIO/secured-guard/actions
echo.
echo O workflow agora inclui:
echo  - Diagnostico de status dos containers
echo  - Diagnostico de conectividade
echo  - Health check detalhado com logs
echo.
pause

