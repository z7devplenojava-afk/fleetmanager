#!/bin/bash

# Script para configurar o repositório Git corretamente para CI
# Execute: bash configurar-repositorio-ci.sh

set -e

echo "🔧 =========================================="
echo "🔧 CONFIGURAÇÃO DO REPOSITÓRIO GIT PARA CI"
echo "🔧 ========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -d ".git" ]; then
    echo "❌ Este diretório não é um repositório Git!"
    echo "   Execute este script dentro do diretório do projeto."
    exit 1
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "none")
echo "📋 Branch atual: $CURRENT_BRANCH"

# Verificar remotes
echo ""
echo "📡 Verificando remotes..."
git remote -v

# Verificar se o remote origin existe
if ! git remote | grep -q "^origin$"; then
    echo ""
    echo "⚠️ Remote 'origin' não encontrado. Adicionando..."
    read -p "Digite a URL do repositório (ex: https://github.com/zmarioramos/fluxbus.git): " REPO_URL
    if [ -z "$REPO_URL" ]; then
        REPO_URL="https://github.com/zmarioramos/fluxbus.git"
        echo "Usando URL padrão: $REPO_URL"
    fi
    git remote add origin "$REPO_URL"
fi

# Buscar todas as branches remotas
echo ""
echo "🔄 Buscando branches remotas..."
git fetch origin

# Listar branches disponíveis
echo ""
echo "📋 Branches disponíveis no remoto:"
git branch -r | grep -v HEAD | sed 's/origin\///' | sed 's/^/  - /'

# Verificar se a branch 'ci' existe no remoto
if git ls-remote --heads origin ci | grep -q ci; then
    echo ""
    echo "✅ Branch 'ci' encontrada no remoto!"
    
    # Mudar para a branch ci
    if [ "$CURRENT_BRANCH" != "ci" ]; then
        echo "🔄 Mudando para branch 'ci'..."
        if git checkout ci 2>/dev/null; then
            echo "✅ Mudou para branch 'ci'"
        else
            echo "📥 Criando branch 'ci' local baseada na remota..."
            git checkout -b ci origin/ci
        fi
    else
        echo "✅ Já está na branch 'ci'"
    fi
    
    # Fazer pull
    echo ""
    echo "📥 Fazendo pull da branch 'ci'..."
    git pull origin ci
    
    echo ""
    echo "✅ =========================================="
    echo "✅ REPOSITÓRIO CONFIGURADO COM SUCESSO!"
    echo "✅ ========================================="
    echo ""
    echo "📋 Status atual:"
    git status --short
    echo ""
    echo "📋 Branch atual: $(git branch --show-current)"
    echo "📋 Último commit: $(git log -1 --oneline)"
    
else
    echo ""
    echo "⚠️ Branch 'ci' não encontrada no remoto!"
    echo ""
    echo "📋 Branches disponíveis:"
    git branch -r | grep -v HEAD | sed 's/origin\///' | sed 's/^/  - /'
    echo ""
    echo "💡 Opções:"
    echo "   1. Criar branch 'ci' localmente e fazer push"
    echo "   2. Usar outra branch existente"
    echo ""
    read -p "Deseja criar a branch 'ci' localmente? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        # Verificar se há uma branch base (master ou main)
        if git ls-remote --heads origin master | grep -q master; then
            BASE_BRANCH="master"
        elif git ls-remote --heads origin main | grep -q main; then
            BASE_BRANCH="main"
        else
            # Usar a primeira branch disponível
            BASE_BRANCH=$(git branch -r | grep -v HEAD | head -1 | sed 's/origin\///' | xargs)
        fi
        
        echo "📥 Fazendo checkout da branch base: $BASE_BRANCH"
        git fetch origin $BASE_BRANCH
        git checkout -b ci origin/$BASE_BRANCH 2>/dev/null || git checkout -b ci
        
        echo "📤 Fazendo push da branch 'ci'..."
        git push -u origin ci
        
        echo "✅ Branch 'ci' criada e enviada para o remoto!"
    fi
fi

echo ""
echo "📋 Próximos passos:"
echo "   cd /root/fluxbus/ci"
echo "   docker-compose -f docker-compose.ci.yml up -d"
echo ""

