#!/bin/bash

# Script para configurar o ambiente CI no servidor VPS
# Execute este script no servidor para preparar o ambiente

set -e

echo "🔧 =========================================="
echo "🔧 CONFIGURAÇÃO DO AMBIENTE CI"
echo "🔧 ========================================="
echo ""

# 1. Sair do modo Swarm se estiver ativo
echo "1️⃣ Verificando modo Docker Swarm..."
if docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "⚠️ Docker está em modo Swarm"
    echo "🔄 Saindo do modo Swarm..."
    docker swarm leave --force 2>/dev/null || echo "⚠️ Não foi possível sair do modo Swarm (pode estar em uso)"
    sleep 2
else
    echo "✅ Docker não está em modo Swarm"
fi

# 2. Detectar diretório do projeto
echo ""
echo "2️⃣ Detectando diretório do projeto..."
# Tentar encontrar o diretório do projeto
if [ -d "/root/fluxbus/ci" ]; then
    CI_DIR="/root/fluxbus/ci"
    echo "✅ Diretório encontrado: $CI_DIR"
elif [ -d "/var/www/fluxbus/ci" ]; then
    CI_DIR="/var/www/fluxbus/ci"
    echo "✅ Diretório encontrado: $CI_DIR"
elif [ -d "./ci" ]; then
    CI_DIR="$(pwd)/ci"
    echo "✅ Diretório encontrado: $CI_DIR"
else
    # Tentar criar em /root/fluxbus/ci primeiro
    CI_DIR="/root/fluxbus/ci"
    echo "📁 Criando diretório $CI_DIR..."
    mkdir -p "$CI_DIR"
    echo "✅ Diretório criado: $CI_DIR"
fi

# Criar diretório de volumes se não existir
VOLUMES_DIR="/var/www/fluxbus/ci"
if [ ! -d "$VOLUMES_DIR" ]; then
    echo "📁 Criando diretório de volumes: $VOLUMES_DIR..."
    mkdir -p "$VOLUMES_DIR"
    echo "✅ Diretório de volumes criado"
else
    echo "✅ Diretório de volumes já existe: $VOLUMES_DIR"
fi

# 3. Criar redes Docker necessárias
echo ""
echo "3️⃣ Criando redes Docker..."

# Rede z7network
if ! docker network ls | grep -q "z7network"; then
    echo "📡 Criando rede z7network..."
    docker network create z7network 2>&1 || echo "⚠️ Erro ao criar rede z7network (pode já existir)"
else
    echo "✅ Rede z7network já existe"
fi

# Rede fluxbus-ci-network
if ! docker network ls | grep -q "fluxbus-ci"; then
    echo "📡 Criando rede fluxbus-ci-network..."
    docker network create fluxbus-ci-network 2>&1 || echo "⚠️ Erro ao criar rede fluxbus-ci-network (pode já existir)"
else
    echo "✅ Rede fluxbus-ci-network já existe"
fi

# 4. Verificar se o docker-compose.ci.yml existe
echo ""
echo "4️⃣ Verificando arquivo docker-compose.ci.yml..."
if [ ! -f "$CI_DIR/docker-compose.ci.yml" ]; then
    echo "⚠️ Arquivo docker-compose.ci.yml não encontrado em $CI_DIR"
    echo "   Certifique-se de que o projeto foi clonado corretamente"
else
    echo "✅ Arquivo docker-compose.ci.yml encontrado"
fi

# 5. Verificar se o nginx/ci.conf existe
echo ""
echo "5️⃣ Verificando arquivo nginx/ci.conf..."
if [ ! -f "$CI_DIR/nginx/ci.conf" ]; then
    echo "⚠️ Arquivo nginx/ci.conf não encontrado em $CI_DIR/nginx/"
    echo "   Certifique-se de que o projeto foi clonado corretamente"
else
    echo "✅ Arquivo nginx/ci.conf encontrado"
fi

# 6. Criar diretórios necessários
echo ""
echo "6️⃣ Criando diretórios necessários..."
# Diretórios no projeto
mkdir -p "$CI_DIR/nginx"
# Diretórios de volumes (usados pelo docker-compose)
mkdir -p "$VOLUMES_DIR/postgres_data"
mkdir -p "$VOLUMES_DIR/redis_data"
mkdir -p "$VOLUMES_DIR/uploads"
mkdir -p "$VOLUMES_DIR/logs"
mkdir -p "$VOLUMES_DIR/whatsapp_sessions"
mkdir -p "$VOLUMES_DIR/backups"
echo "✅ Diretórios criados"

# 7. Verificar permissões
echo ""
echo "7️⃣ Verificando permissões..."
chmod -R 755 "$CI_DIR" 2>/dev/null || echo "⚠️ Não foi possível ajustar permissões do projeto (pode precisar de sudo)"
chmod -R 755 "$VOLUMES_DIR" 2>/dev/null || echo "⚠️ Não foi possível ajustar permissões dos volumes (pode precisar de sudo)"
echo "✅ Permissões verificadas"

# 8. Resumo
echo ""
echo "✅ =========================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA"
echo "✅ ========================================="
echo ""
echo "📋 Informações importantes:"
echo "   📁 Diretório do projeto: $CI_DIR"
echo "   💾 Diretório de volumes: $VOLUMES_DIR"
echo ""
echo "📋 Próximos passos:"
echo "   1. Certifique-se de que o projeto está clonado em: $CI_DIR"
echo "   2. Execute: cd $CI_DIR"
echo "   3. Execute: docker-compose -f docker-compose.ci.yml up -d"
echo ""
echo "📋 Para verificar o status:"
echo "   cd $CI_DIR && docker-compose -f docker-compose.ci.yml ps"
echo ""
echo "📋 Para ver os logs:"
echo "   cd $CI_DIR && docker-compose -f docker-compose.ci.yml logs -f"
echo ""

