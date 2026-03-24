@echo off
echo ========================================
echo  COMMIT E PUSH - Correcoes JWT e URLs
echo ========================================
echo.

echo [1/4] Adicionando arquivos...
git add .

echo.
echo [2/4] Fazendo commit...
git commit -m "fix: Corrigir URLs hardcoded, autenticacao JWT e adicionar debug" -m "CORRECOES CRITICAS:" -m "- Remover fake-token do AuthContext" -m "- Adicionar validacao de token JWT" -m "- URLs dinamicos com getApiUrl()" -m "- Debug melhorado no interceptor Axios" -m "- Endpoint debug para listar arquivos PDF" -m "" -m "RESOLVE:" -m "- Erro 500 em /unified-documents/create" -m "- Erro 500 em /login" -m "- Erro 500 em /holerites" -m "- Frontend dependente do local" -m "- Token fake sendo salvo"

echo.
echo [3/4] Fazendo push para branch ci...
git push origin ci

echo.
echo [4/4] Verificando status...
git status

echo.
echo ========================================
echo  CONCLUIDO!
echo ========================================
echo.
echo Aguarde 5-10 minutos para o deploy automatico
echo Depois faca LOGOUT e LOGIN novamente no CI
echo.
pause

