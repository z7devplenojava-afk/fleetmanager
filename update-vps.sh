#!/bin/bash

# Script para atualizar o projeto na VPS
# Execute: bash update-vps.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando atualização do projeto na VPS..."

# Navegar para o diretório do projeto
cd ~/secured_guard || {
    echo "❌ Diretório ~/secured_guard não encontrado!"
    exit 1
}

echo "📂 Diretório atual: $(pwd)"

# Verificar status do git
echo ""
echo "📊 Verificando status do Git..."
git status

# Verificar se há mudanças locais não commitadas
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Há mudanças locais não commitadas!"
    read -p "Deseja fazer stash das mudanças? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git stash save "Backup antes de atualizar - $(date +%Y%m%d_%H%M%S)"
        echo "✅ Mudanças salvas no stash"
    else
        echo "❌ Atualização cancelada. Faça commit ou stash das mudanças primeiro."
        exit 1
    fi
fi

# Buscar atualizações do repositório remoto
echo ""
echo "🔄 Buscando atualizações do repositório remoto..."
git fetch origin

# Verificar diferenças
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
BASE=$(git merge-base @ @{u})

if [ $LOCAL = $REMOTE ]; then
    echo "✅ Projeto já está atualizado!"
    exit 0
elif [ $LOCAL = $BASE ]; then
    echo "📥 Há atualizações disponíveis. Fazendo pull..."
    git pull origin ci
elif [ $REMOTE = $BASE ]; then
    echo "⚠️  Você tem commits locais que não estão no remoto!"
    read -p "Deseja fazer push primeiro? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git push origin ci
    fi
else
    echo "⚠️  Divergência detectada entre local e remoto!"
    read -p "Deseja fazer merge? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git pull origin ci
    else
        echo "❌ Atualização cancelada."
        exit 1
    fi
fi

# Verificar se há docker-compose.ci.yml
if [ -f "docker-compose.ci.yml" ]; then
    echo ""
    echo "🐳 Reconstruindo containers Docker..."
    
    # Parar e remover containers
    echo "⏹️  Parando containers..."
    docker-compose -f docker-compose.ci.yml stop 2>/dev/null || true
    
    echo "🗑️  Removendo containers..."
    docker-compose -f docker-compose.ci.yml rm -f 2>/dev/null || true
    
    # Remover containers individuais se ainda existirem
    docker rm -f secured-guard-db-ci 2>/dev/null || true
    docker rm -f secured-guard-redis-ci 2>/dev/null || true
    docker rm -f secured-guard-backend-ci 2>/dev/null || true
    docker rm -f secured-guard-frontend-ci 2>/dev/null || true
    docker rm -f secured-guard-nginx-ci 2>/dev/null || true
    docker rm -f secured-guard-whatsapp-ci 2>/dev/null || true
    docker rm -f secured-guard-evolution-api-ci 2>/dev/null || true
    
    # Remover redes
    echo "🌐 Limpando redes..."
    docker network rm secured-guard-ci 2>/dev/null || true
    docker network prune -f
    
    # Aguardar um pouco
    sleep 2
    
    # Reconstruir imagens (sem cache para garantir atualização)
    echo "🔨 Reconstruindo imagens..."
    docker-compose -f docker-compose.ci.yml build --no-cache
    
    # Iniciar containers
    echo "▶️  Iniciando containers..."
    docker-compose -f docker-compose.ci.yml up -d
    
    # Mostrar logs
    echo ""
    echo "📋 Status dos containers:"
    docker-compose -f docker-compose.ci.yml ps
    
    echo ""
    echo "📋 Últimas linhas dos logs do backend:"
    docker-compose -f docker-compose.ci.yml logs --tail=20 backend-ci
    
else
    echo "⚠️  Arquivo docker-compose.ci.yml não encontrado!"
    echo "   Pulando reconstrução dos containers."
fi

echo ""
echo "✅ Atualização concluída com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique os logs: docker-compose -f docker-compose.ci.yml logs -f"
echo "   2. Verifique o status: docker-compose -f docker-compose.ci.yml ps"
echo "   3. Teste a aplicação: https://ci.z7botsolutions.com.br"

