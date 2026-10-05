#!/bin/bash

# Script para atualizar o projeto na VPS AGORA
# Execute: bash update-vps-now.sh

set -e  # Parar em caso de erro

echo "🚀 Atualizando projeto na VPS..."

# Navegar para o diretório do projeto
cd ~/fluxbus || {
    echo "❌ Diretório ~/fluxbus não encontrado!"
    exit 1
}

echo "📂 Diretório atual: $(pwd)"

# Verificar branch atual
echo ""
echo "🌿 Verificando branch atual..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Branch atual: $CURRENT_BRANCH"

# Se não estiver na branch ci, mudar para ela
if [ "$CURRENT_BRANCH" != "ci" ]; then
    echo "⚠️  Não está na branch 'ci'. Mudando para branch 'ci'..."
    git checkout ci
fi

# Verificar status
echo ""
echo "📊 Verificando status do Git..."
git status

# Buscar atualizações
echo ""
echo "🔄 Buscando atualizações do repositório remoto..."
git fetch origin

# Verificar se há atualizações
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || git rev-parse origin/ci)
BASE=$(git merge-base @ $REMOTE 2>/dev/null || echo "")

if [ -z "$BASE" ]; then
    echo "⚠️  Não foi possível determinar diferenças. Tentando pull direto..."
    git pull origin ci
elif [ $LOCAL = $REMOTE ]; then
    echo "✅ Projeto já está atualizado!"
    echo "   Local:  $LOCAL"
    echo "   Remote: $REMOTE"
    exit 0
else
    echo "📥 Há atualizações disponíveis!"
    echo "   Local:  $LOCAL"
    echo "   Remote: $REMOTE"
    echo ""
    echo "📋 Últimos commits que serão baixados:"
    git log HEAD..$REMOTE --oneline -5
    echo ""
    read -p "Deseja continuar com a atualização? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Atualização cancelada."
        exit 1
    fi
    
    # Fazer pull
    echo "📥 Fazendo pull..."
    git pull origin ci
fi

# Verificar se há docker-compose.ci.yml
if [ -f "docker-compose.ci.yml" ]; then
    echo ""
    echo "🐳 Reconstruindo containers Docker..."
    
    # Parar containers
    echo "⏹️  Parando containers..."
    docker-compose -f docker-compose.ci.yml stop backend-ci 2>/dev/null || true
    
    # Reconstruir apenas o backend (mais rápido)
    echo "🔨 Reconstruindo imagem do backend..."
    docker-compose -f docker-compose.ci.yml build --no-cache backend-ci
    
    # Iniciar containers
    echo "▶️  Reiniciando backend..."
    docker-compose -f docker-compose.ci.yml up -d backend-ci
    
    # Aguardar containers iniciarem
    echo ""
    echo "⏳ Aguardando backend iniciar..."
    sleep 5
    
    # Verificar status
    echo ""
    echo "📋 Status dos containers:"
    docker-compose -f docker-compose.ci.yml ps
    
    # Mostrar logs do backend
    echo ""
    echo "📋 Últimas 30 linhas dos logs do backend:"
    docker-compose -f docker-compose.ci.yml logs --tail=30 backend-ci
    
    echo ""
    echo "✅ Atualização concluída!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Verifique os logs: docker-compose -f docker-compose.ci.yml logs -f backend-ci"
    echo "   2. Verifique o status: docker-compose -f docker-compose.ci.yml ps"
    echo "   3. Teste a aplicação: https://ci.z7botsolutions.com.br"
else
    echo "⚠️  Arquivo docker-compose.ci.yml não encontrado!"
    echo "   Pulando reconstrução dos containers."
fi

