#!/bin/bash

# Script para corrigir erro 405 no Nginx do servidor CI
# Este script deve ser executado NO SERVIDOR CI via SSH

echo "========================================="
echo "  CORRIGINDO NGINX CI - ERROR 405"
echo "========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se nginx está rodando
echo -e "${YELLOW}1. Verificando Nginx...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx está rodando${NC}"
else
    echo -e "${RED}❌ Nginx não está rodando!${NC}"
    exit 1
fi

# 2. Encontrar arquivo de configuração
echo -e "\n${YELLOW}2. Procurando configuração do CI...${NC}"
NGINX_CONF=""

# Possíveis localizações
PATHS=(
    "/etc/nginx/sites-enabled/ci.z7botsolutions.com.br"
    "/etc/nginx/sites-enabled/ci"
    "/etc/nginx/conf.d/ci.conf"
    "/etc/nginx/conf.d/ci.z7botsolutions.com.br.conf"
    "/etc/nginx/nginx.conf"
)

for path in "${PATHS[@]}"; do
    if [ -f "$path" ]; then
        NGINX_CONF="$path"
        echo -e "${GREEN}✅ Encontrado: $NGINX_CONF${NC}"
        break
    fi
done

if [ -z "$NGINX_CONF" ]; then
    echo -e "${RED}❌ Configuração não encontrada!${NC}"
    echo "Execute manualmente:"
    echo "  sudo find /etc/nginx -name '*ci*'"
    exit 1
fi

# 3. Backup da configuração atual
echo -e "\n${YELLOW}3. Fazendo backup...${NC}"
sudo cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ Backup criado${NC}"

# 4. Verificar se o problema existe
echo -e "\n${YELLOW}4. Verificando configuração atual...${NC}"
if grep -q "proxy_pass.*backend" "$NGINX_CONF"; then
    echo -e "${GREEN}✅ Proxy configurado${NC}"
else
    echo -e "${RED}❌ Proxy não encontrado!${NC}"
fi

# 5. Mostrar configuração atual do /api/
echo -e "\n${YELLOW}5. Configuração atual do /api/:${NC}"
grep -A 10 "location /api/" "$NGINX_CONF" || echo "Não encontrado"

# 6. Aplicar correção
echo -e "\n${YELLOW}6. Aplicando correção...${NC}"

# Criar arquivo temporário com a correção
cat > /tmp/nginx_fix.conf << 'EOF'
    # API routes - TODOS os métodos permitidos
    location /api/ {
        # Permitir todos os métodos HTTP
        if ($request_method !~ ^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)$ ) {
            return 405;
        }
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Preflight request
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Proxy para Traefik (que roteia para o backend)
        proxy_pass http://localhost:80/api/;  # ou porta do Traefik
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
EOF

echo -e "${GREEN}✅ Arquivo de correção criado em /tmp/nginx_fix.conf${NC}"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASSOS MANUAIS:${NC}"
echo "1. Edite a configuração:"
echo "   sudo nano $NGINX_CONF"
echo ""
echo "2. Substitua o bloco 'location /api/' pelo conteúdo de:"
echo "   cat /tmp/nginx_fix.conf"
echo ""
echo "3. Teste a configuração:"
echo "   sudo nginx -t"
echo ""
echo "4. Se OK, recarregue:"
echo "   sudo systemctl reload nginx"
echo ""
echo "5. Teste o login:"
echo "   curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"test\",\"password\":\"test\"}'"
echo ""
echo -e "${GREEN}=========================================${NC}"

