#!/bin/bash

# Script de correção automática do NGINX no ambiente CI
# Uso: ./fix-ci-nginx.sh

set -e

echo "🚨 =========================================="
echo "   CORREÇÃO NGINX CI - Erro 405"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
NGINX_CONTAINER="secured-guard-nginx-ci"
BACKEND_CONTAINER="secured-guard-backend-ci"
COMPOSE_FILE="docker-compose.ci.yml"

# Função para verificar se container existe
check_container() {
    if ! docker ps -a --format '{{.Names}}' | grep -q "^$1$"; then
        echo -e "${RED}❌ Container $1 não encontrado!${NC}"
        echo "Containers disponíveis:"
        docker ps -a --format "table {{.Names}}\t{{.Status}}"
        exit 1
    fi
}

# Função para verificar se container está rodando
check_running() {
    if ! docker ps --format '{{.Names}}' | grep -q "^$1$"; then
        echo -e "${RED}❌ Container $1 não está rodando!${NC}"
        echo "Iniciando container..."
        docker start $1
        sleep 5
    fi
}

echo "1️⃣ Verificando containers..."
check_container $NGINX_CONTAINER
check_container $BACKEND_CONTAINER
check_running $NGINX_CONTAINER
check_running $BACKEND_CONTAINER
echo -e "${GREEN}✅ Containers encontrados e rodando${NC}"
echo ""

echo "2️⃣ Fazendo backup da configuração atual..."
BACKUP_FILE="/etc/nginx/nginx.conf.backup-$(date +%Y%m%d-%H%M%S)"
docker exec $NGINX_CONTAINER cp /etc/nginx/nginx.conf $BACKUP_FILE
echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
echo ""

echo "3️⃣ Verificando configuração atual..."
echo "Procurando por 'proxy_pass' na seção /api/..."
CURRENT_CONFIG=$(docker exec $NGINX_CONTAINER grep -A 5 "location /api/" /etc/nginx/nginx.conf | grep proxy_pass || echo "não encontrado")
echo "Configuração atual: $CURRENT_CONFIG"
echo ""

if echo "$CURRENT_CONFIG" | grep -q "proxy_pass http://backend_ci/api/"; then
    echo -e "${YELLOW}⚠️  A configuração já parece estar correta!${NC}"
    echo "Mas vamos recarregar o NGINX mesmo assim..."
else
    echo -e "${RED}❌ Configuração incorreta detectada!${NC}"
    echo "É necessário atualizar manualmente o arquivo nginx.conf"
    echo ""
    echo "Execute:"
    echo "  docker exec -it $NGINX_CONTAINER vi /etc/nginx/nginx.conf"
    echo ""
    echo "E substitua a linha:"
    echo "  proxy_pass http://backend_ci/;"
    echo "Por:"
    echo "  proxy_pass http://backend_ci/api/;"
    echo ""
    read -p "Pressione ENTER após fazer a correção manual..."
fi

echo "4️⃣ Testando configuração do NGINX..."
if docker exec $NGINX_CONTAINER nginx -t; then
    echo -e "${GREEN}✅ Configuração válida!${NC}"
else
    echo -e "${RED}❌ Erro na configuração!${NC}"
    echo "Restaurando backup..."
    docker exec $NGINX_CONTAINER cp $BACKUP_FILE /etc/nginx/nginx.conf
    exit 1
fi
echo ""

echo "5️⃣ Recarregando NGINX..."
docker exec $NGINX_CONTAINER nginx -s reload
echo -e "${GREEN}✅ NGINX recarregado!${NC}"
echo ""

echo "6️⃣ Aguardando 3 segundos..."
sleep 3
echo ""

echo "7️⃣ Testando conectividade com backend..."
if docker exec $NGINX_CONTAINER curl -s -f http://$BACKEND_CONTAINER:8080/api/actuator/health > /dev/null; then
    echo -e "${GREEN}✅ Backend acessível!${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo!${NC}"
    echo "Verificando logs do backend..."
    docker logs $BACKEND_CONTAINER --tail 20
    exit 1
fi
echo ""

echo "8️⃣ Testando endpoint de login..."
echo "Fazendo requisição POST para /api/auth/login..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"123456"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Login funcionando! Status 200 OK${NC}"
    echo "Resposta: $BODY"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠️  Status 401 - Credenciais inválidas (mas o endpoint está funcionando!)${NC}"
elif [ "$HTTP_CODE" = "405" ]; then
    echo -e "${RED}❌ Ainda retornando 405! A correção não foi aplicada corretamente.${NC}"
    echo "Verifique manualmente a configuração do NGINX."
    exit 1
else
    echo -e "${YELLOW}⚠️  Status inesperado: $HTTP_CODE${NC}"
    echo "Resposta: $BODY"
fi
echo ""

echo "9️⃣ Verificando logs do NGINX..."
echo "Últimas 10 linhas:"
docker logs $NGINX_CONTAINER --tail 10
echo ""

echo "=========================================="
echo -e "${GREEN}✅ CORREÇÃO CONCLUÍDA!${NC}"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo "1. Teste o login no navegador: https://ci.z7botsolutions.com.br"
echo "2. Verifique o console do navegador (F12)"
echo "3. Se ainda houver erro 405, execute:"
echo "   docker logs $NGINX_CONTAINER -f"
echo ""
echo "📞 Suporte:"
echo "   - Logs NGINX: docker logs $NGINX_CONTAINER"
echo "   - Logs Backend: docker logs $BACKEND_CONTAINER"
echo "   - Restaurar backup: docker exec $NGINX_CONTAINER cp $BACKUP_FILE /etc/nginx/nginx.conf"
echo ""
