#!/bin/bash

# ============================================
# Script de Correção Automática do NGINX CI
# Resolve erro 405 Method Not Allowed
# ============================================

set -e

echo "🔍 Detectando ambiente NGINX..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "nginx/ci.conf" ]; then
    print_error "Arquivo nginx/ci.conf não encontrado!"
    print_info "Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

print_info "Iniciando correção do NGINX CI..."

# Detectar tipo de instalação NGINX
NGINX_TYPE=""

# 1. Verificar se há container nginx
if docker ps --format '{{.Names}}' | grep -q "nginx"; then
    NGINX_CONTAINER=$(docker ps --format '{{.Names}}' | grep nginx | head -n 1)
    NGINX_TYPE="container"
    print_info "NGINX detectado em container: $NGINX_CONTAINER"
    
# 2. Verificar se nginx está instalado no host
elif command -v nginx &> /dev/null; then
    NGINX_TYPE="host"
    print_info "NGINX detectado no host"
    
# 3. Verificar se está usando Traefik
elif docker ps --format '{{.Names}}' | grep -q "traefik"; then
    NGINX_TYPE="traefik"
    print_warning "Traefik detectado - NGINX pode não estar em uso"
    print_info "O erro 405 pode estar vindo do Traefik ou do backend"
else
    print_error "Nenhum NGINX detectado!"
    print_info "Verificando se o backend está rodando..."
    
    if docker ps --format '{{.Names}}' | grep -q "backend-ci"; then
        print_success "Backend está rodando"
        print_info "O problema pode estar na configuração do Traefik ou Cloudflare"
    else
        print_error "Backend não está rodando!"
        print_info "Inicie o backend com: docker-compose -f docker-compose.ci.yml up -d backend-ci"
        exit 1
    fi
fi

# Verificar se backend está rodando
print_info "Verificando backend..."
if docker ps --format '{{.Names}}' | grep -q "backend-ci"; then
    BACKEND_CONTAINER=$(docker ps --format '{{.Names}}' | grep backend-ci | head -n 1)
    print_success "Backend rodando: $BACKEND_CONTAINER"
    
    # Testar conectividade do backend
    print_info "Testando endpoint do backend..."
    if docker exec "$BACKEND_CONTAINER" curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
        print_success "Backend respondendo na porta 8081"
    else
        print_warning "Backend não responde na porta 8081"
    fi
else
    print_error "Backend não está rodando!"
    exit 1
fi

# Aplicar correção baseada no tipo
case $NGINX_TYPE in
    "container")
        print_info "Aplicando correção no container NGINX..."
        
        # Backup da configuração atual
        print_info "Fazendo backup da configuração atual..."
        docker exec "$NGINX_CONTAINER" cat /etc/nginx/nginx.conf > "nginx_backup_$(date +%Y%m%d_%H%M%S).conf" || true
        
        # Copiar nova configuração
        print_info "Copiando nova configuração..."
        docker cp nginx/ci.conf "$NGINX_CONTAINER:/etc/nginx/nginx.conf"
        
        # Testar configuração
        print_info "Testando configuração..."
        if docker exec "$NGINX_CONTAINER" nginx -t; then
            print_success "Configuração válida"
            
            # Recarregar NGINX
            print_info "Recarregando NGINX..."
            docker exec "$NGINX_CONTAINER" nginx -s reload
            print_success "NGINX recarregado com sucesso!"
        else
            print_error "Erro na configuração do NGINX"
            print_warning "Restaurando backup..."
            docker cp "nginx_backup_$(date +%Y%m%d)_*.conf" "$NGINX_CONTAINER:/etc/nginx/nginx.conf"
            exit 1
        fi
        ;;
        
    "host")
        print_info "Aplicando correção no NGINX do host..."
        
        # Detectar localização da configuração
        if [ -f "/etc/nginx/sites-available/secured-guard-ci.conf" ]; then
            CONFIG_PATH="/etc/nginx/sites-available/secured-guard-ci.conf"
        elif [ -f "/etc/nginx/conf.d/secured-guard-ci.conf" ]; then
            CONFIG_PATH="/etc/nginx/conf.d/secured-guard-ci.conf"
        elif [ -f "/etc/nginx/nginx.conf" ]; then
            CONFIG_PATH="/etc/nginx/nginx.conf"
        else
            print_error "Arquivo de configuração do NGINX não encontrado"
            exit 1
        fi
        
        print_info "Configuração encontrada em: $CONFIG_PATH"
        
        # Backup
        print_info "Fazendo backup..."
        sudo cp "$CONFIG_PATH" "${CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Copiar nova configuração
        print_info "Copiando nova configuração..."
        sudo cp nginx/ci.conf "$CONFIG_PATH"
        
        # Testar
        print_info "Testando configuração..."
        if sudo nginx -t; then
            print_success "Configuração válida"
            
            # Recarregar
            print_info "Recarregando NGINX..."
            sudo systemctl reload nginx
            print_success "NGINX recarregado com sucesso!"
        else
            print_error "Erro na configuração do NGINX"
            print_warning "Restaurando backup..."
            sudo cp "${CONFIG_PATH}.backup."* "$CONFIG_PATH"
            exit 1
        fi
        ;;
        
    "traefik")
        print_warning "Ambiente usando Traefik"
        print_info "Verificando configuração do Traefik..."
        
        # Verificar labels do backend no docker-compose
        if [ -f "docker-compose.ci.yml" ]; then
            print_info "Verificando labels do Traefik em docker-compose.ci.yml..."
            grep -A 5 "traefik.enable" docker-compose.ci.yml || true
        fi
        
        print_info "Para corrigir com Traefik:"
        echo "1. Verificar labels no docker-compose.ci.yml"
        echo "2. Garantir que backend está na porta correta (8081)"
        echo "3. Reiniciar services: docker-compose -f docker-compose.ci.yml restart backend-ci"
        ;;
        
    *)
        print_error "Tipo de configuração desconhecido"
        exit 1
        ;;
esac

# Testes finais
echo ""
print_info "Executando testes..."

# Teste 1: Health check
print_info "Teste 1: Health check do backend..."
if curl -s http://localhost:8081/api/health > /dev/null; then
    print_success "Backend respondendo"
else
    print_warning "Backend não responde diretamente"
fi

# Teste 2: Login endpoint (deve retornar 400/401, não 405)
print_info "Teste 2: Endpoint de login..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "405" ]; then
    print_error "Ainda retornando 405! 😞"
    print_info "Verifique manualmente os logs"
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
    print_success "Endpoint respondendo corretamente (HTTP $HTTP_CODE) 🎉"
else
    print_warning "Status HTTP inesperado: $HTTP_CODE"
fi

echo ""
print_success "Correção aplicada com sucesso!"
echo ""
print_info "Próximos passos:"
echo "1. Teste o login no frontend: https://ci.z7botsolutions.com.br"
echo "2. Monitore os logs: docker logs $BACKEND_CONTAINER -f"
echo "3. Se o problema persistir, verifique o Cloudflare"

# Exibir informações úteis
echo ""
print_info "Comandos úteis:"
echo "  Ver logs backend: docker logs $BACKEND_CONTAINER -f"
if [ "$NGINX_TYPE" = "container" ]; then
    echo "  Ver logs nginx: docker logs $NGINX_CONTAINER -f"
fi
echo "  Testar endpoint: curl -X POST http://localhost/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"password\":\"test\"}'"

exit 0

