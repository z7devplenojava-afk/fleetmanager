#!/bin/bash

# Script para limpar containers antigos e atualizar o projeto na VPS
# Execute: bash cleanup-and-update.sh

set -e  # Parar em caso de erro

echo "🧹 Limpando containers e recursos antigos..."

# Navegar para o diretório do projeto
cd ~/secured_guard || {
    echo "❌ Diretório ~/secured_guard não encontrado!"
    exit 1
}

# Parar todos os containers relacionados
echo ""
echo "⏹️  Parando containers..."
docker-compose -f docker-compose.ci.yml stop 2>/dev/null || true

# Remover containers
echo "🗑️  Removendo containers..."
docker-compose -f docker-compose.ci.yml rm -f 2>/dev/null || true

# Remover containers individuais se ainda existirem
echo "🗑️  Removendo containers individuais..."
docker rm -f secured-guard-db-ci 2>/dev/null || true
docker rm -f secured-guard-redis-ci 2>/dev/null || true
docker rm -f secured-guard-backend-ci 2>/dev/null || true
docker rm -f secured-guard-frontend-ci 2>/dev/null || true
docker rm -f secured-guard-nginx-ci 2>/dev/null || true
docker rm -f secured-guard-whatsapp-ci 2>/dev/null || true
docker rm -f secured-guard-evolution-api-ci 2>/dev/null || true

# Aguardar um pouco para garantir que os containers foram removidos
sleep 2

# Remover redes (forçar se necessário)
echo "🌐 Removendo redes..."
docker network rm secured-guard-ci 2>/dev/null || true
docker network prune -f

# Verificar se há containers órfãos
echo "🔍 Verificando containers órfãos..."
ORPHANED=$(docker ps -a --filter "name=secured-guard" --format "{{.Names}}" 2>/dev/null || true)
if [ ! -z "$ORPHANED" ]; then
    echo "⚠️  Encontrados containers órfãos:"
    echo "$ORPHANED"
    read -p "Deseja remover todos os containers órfãos? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "$ORPHANED" | xargs -r docker rm -f
    fi
fi

# Atualizar código do Git
echo ""
echo "📥 Atualizando código do repositório..."
git fetch origin
git pull origin ci

# Reconstruir imagens
echo ""
echo "🔨 Reconstruindo imagens..."
docker-compose -f docker-compose.ci.yml build --no-cache

# Criar e iniciar containers
echo ""
echo "▶️  Criando e iniciando containers..."
docker-compose -f docker-compose.ci.yml up -d

# Aguardar containers iniciarem
echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 5

# Verificar status
echo ""
echo "📋 Status dos containers:"
docker-compose -f docker-compose.ci.yml ps

# Mostrar logs do backend
echo ""
echo "📋 Últimas linhas dos logs do backend:"
docker-compose -f docker-compose.ci.yml logs --tail=30 backend-ci

echo ""
echo "✅ Limpeza e atualização concluídas!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique os logs: docker-compose -f docker-compose.ci.yml logs -f"
echo "   2. Verifique o status: docker-compose -f docker-compose.ci.yml ps"
echo "   3. Teste a aplicação: https://ci.z7botsolutions.com.br"

