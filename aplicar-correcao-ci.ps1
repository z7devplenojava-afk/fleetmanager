# Script para aplicar correção 405 no CI via SSH
# Uso: .\aplicar-correcao-ci.ps1

param(
    [string]$Server = "ci.z7botsolutions.com.br",
    [string]$User = "root",
    [string]$ProjectPath = "/var/www/secured_guard"
)

Write-Host "🔧 Aplicando correção 405 no CI..." -ForegroundColor Cyan
Write-Host ""

# Verificar se tem SSH configurado
$sshTest = ssh -o ConnectTimeout=5 "$User@$Server" "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao conectar via SSH em $User@$Server" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure o SSH primeiro:" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -t rsa" -ForegroundColor Gray
    Write-Host "  ssh-copy-id $User@$Server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ou use senha:" -ForegroundColor Yellow
    Write-Host "  ssh $User@$Server" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Conexão SSH OK" -ForegroundColor Green
Write-Host ""

# Comandos a executar no servidor
$commands = @"
cd $ProjectPath
echo '📥 Fazendo pull das alterações...'
git pull origin main

echo ''
echo '🔍 Verificando arquivo nginx-ci.conf...'
if grep -q 'burst=20' deploy/nginx/nginx-ci.conf; then
    echo '✅ Arquivo atualizado com burst=20'
else
    echo '❌ Arquivo não foi atualizado!'
    exit 1
fi

echo ''
echo '🧪 Testando configuração do NGINX...'
docker exec secured-guard-nginx-ci nginx -t

if [ \$? -eq 0 ]; then
    echo '✅ Configuração válida'
    echo ''
    echo '🔄 Recarregando NGINX...'
    docker exec secured-guard-nginx-ci nginx -s reload
    echo '✅ NGINX recarregado'
else
    echo '❌ Configuração inválida!'
    exit 1
fi

echo ''
echo '⏳ Aguardando 3 segundos...'
sleep 3

echo ''
echo '🧪 Testando endpoint de login...'
HTTP_CODE=\$(curl -s -o /dev/null -w '%{http_code}' -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"username\":\"test\",\"password\":\"test\"}')

echo \"HTTP Status: \$HTTP_CODE\"

if [ \$HTTP_CODE -eq 405 ]; then
    echo '❌ FALHA: Ainda retornando 405'
    echo ''
    echo 'Verificando logs do NGINX:'
    docker logs secured-guard-nginx-ci --tail 20
    exit 1
elif [ \$HTTP_CODE -eq 401 ] || [ \$HTTP_CODE -eq 403 ] || [ \$HTTP_CODE -eq 200 ]; then
    echo '✅ SUCESSO: Login está funcionando (HTTP \$HTTP_CODE)'
else
    echo '⚠️  Resposta inesperada: HTTP \$HTTP_CODE'
fi

echo ''
echo '📋 Últimas linhas do log do NGINX:'
docker logs secured-guard-nginx-ci --tail 10

echo ''
echo '✅ Correção aplicada com sucesso!'
"@

Write-Host "🚀 Executando comandos no servidor..." -ForegroundColor Cyan
Write-Host ""

# Executar comandos via SSH
$result = ssh "$User@$Server" $commands

# Mostrar resultado
Write-Host $result

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Correção aplicada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Teste no navegador:" -ForegroundColor Cyan
    Write-Host "  https://ci.z7botsolutions.com.br" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro ao aplicar correção" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente manualmente:" -ForegroundColor Yellow
    Write-Host "  ssh $User@$Server" -ForegroundColor Gray
    Write-Host "  cd $ProjectPath" -ForegroundColor Gray
    Write-Host "  git pull origin main" -ForegroundColor Gray
    Write-Host "  docker exec secured-guard-nginx-ci nginx -s reload" -ForegroundColor Gray
    exit 1
}
