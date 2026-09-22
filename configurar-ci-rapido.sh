#!/bin/bash

# Script rápido para configurar o ambiente CI no servidor
# Execute este script no servidor: bash configurar-ci-rapido.sh

set -e

echo "🔧 =========================================="
echo "🔧 CONFIGURAÇÃO RÁPIDA DO AMBIENTE CI"
echo "🔧 ========================================="
echo ""

# 1. Sair do modo Swarm
echo "1️⃣ Saindo do modo Docker Swarm..."
docker swarm leave --force 2>/dev/null || echo "⚠️ Não estava em modo Swarm ou não foi possível sair"
sleep 2

# 2. Criar redes Docker
echo ""
echo "2️⃣ Criando redes Docker..."
docker network create z7network 2>/dev/null || echo "✅ Rede z7network já existe"
docker network create fluxbus-ci-network 2>/dev/null || echo "✅ Rede fluxbus-ci-network já existe"

# 3. Criar diretórios de volumes
echo ""
echo "3️⃣ Criando diretórios de volumes..."
mkdir -p /var/www/fluxbus/ci/postgres_data
mkdir -p /var/www/fluxbus/ci/redis_data
mkdir -p /var/www/fluxbus/ci/uploads
mkdir -p /var/www/fluxbus/ci/logs
mkdir -p /var/www/fluxbus/ci/whatsapp_sessions
mkdir -p /var/www/fluxbus/ci/backups

# 4. Ir para o diretório do projeto
echo ""
echo "4️⃣ Verificando diretório do projeto..."
if [ -d "/root/fluxbus/ci" ]; then
    cd /root/fluxbus/ci
    echo "✅ Usando diretório: /root/fluxbus/ci"
elif [ -d "/root/fluxbus" ]; then
    cd /root/fluxbus
    echo "✅ Usando diretório: /root/fluxbus"
else
    echo "❌ Diretório do projeto não encontrado!"
    echo "   Por favor, clone o repositório primeiro:"
    echo "   cd /root && git clone https://github.com/zmarioramos/fluxbus.git fluxbus"
    exit 1
fi

# 5. Verificar se docker-compose.ci.yml existe
if [ ! -f "docker-compose.ci.yml" ]; then
    echo "❌ Arquivo docker-compose.ci.yml não encontrado!"
    echo "   Certifique-se de estar no diretório correto e que o projeto foi clonado."
    exit 1
fi

# 6. Resumo
echo ""
echo "✅ =========================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA"
echo "✅ ========================================="
echo ""
echo "📋 Próximos passos:"
echo "   cd $(pwd)"
echo "   docker-compose -f docker-compose.ci.yml up -d"
echo ""
echo "📋 Para verificar o status:"
echo "   docker-compose -f docker-compose.ci.yml ps"
echo ""
echo "📋 Para ver os logs:"
echo "   docker-compose -f docker-compose.ci.yml logs -f"
echo ""

