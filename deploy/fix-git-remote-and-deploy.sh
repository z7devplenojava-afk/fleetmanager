#!/bin/bash

# Script para configurar remote Git e fazer deploy na VPS
# Execute este script na VPS quando o remote 'origin' não estiver configurado

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🔧 Configurando repositório Git na VPS..."

# Verificar se estamos em um diretório Git
if [ ! -d ".git" ]; then
    error "Este diretório não é um repositório Git. Execute 'git init' primeiro ou clone o repositório."
fi

# Verificar se o remote origin existe
if git remote | grep -q "^origin$"; then
    log "Remote 'origin' já existe. Verificando URL..."
    git remote -v
else
    log "Remote 'origin' não encontrado. Adicionando..."
    
    # Perguntar qual método usar
    echo ""
    echo "Escolha o método de autenticação:"
    echo "1) HTTPS com token (recomendado)"
    echo "2) SSH"
    read -p "Digite 1 ou 2: " method
    
    case $method in
        1)
            read -p "Digite seu token GitHub (ghp_...): " token
            if [ -z "$token" ]; then
                error "Token não fornecido"
            fi
            git remote add origin "https://${token}@github.com/zmarioramos/secured-guard.git"
            log "✅ Remote 'origin' adicionado com HTTPS"
            ;;
        2)
            git remote add origin "git@github.com:zmarioramos/secured-guard.git"
            log "✅ Remote 'origin' adicionado com SSH"
            # Verificar se a chave SSH está configurada
            if ! ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
                warn "⚠️ Chave SSH pode não estar configurada. Configure antes de continuar."
            fi
            ;;
        *)
            error "Opção inválida"
            ;;
    esac
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "none")
log "Branch atual: $CURRENT_BRANCH"

# Se não houver branch local, criar baseado na remota
if [ "$CURRENT_BRANCH" = "none" ] || [ -z "$CURRENT_BRANCH" ]; then
    log "Nenhuma branch local encontrada. Criando branch 'ci' baseada na remota..."
    git fetch origin ci || error "Não foi possível fazer fetch da branch 'ci'"
    git checkout -b ci origin/ci || git checkout ci
else
    # Fazer fetch primeiro
    log "Fazendo fetch do remote..."
    git fetch origin || warn "Fetch falhou, mas continuando..."
fi

# Verificar se está na branch ci
if [ "$CURRENT_BRANCH" != "ci" ]; then
    log "Mudando para branch 'ci'..."
    git checkout ci 2>/dev/null || git checkout -b ci origin/ci
fi

# Verificar se há mudanças locais
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "Há mudanças locais não commitadas. Fazendo stash..."
    git stash save "Stash antes do pull - $(date +'%Y-%m-%d %H:%M:%S')"
fi

# Fazer pull
log "Fazendo pull da branch 'ci'..."
if git pull origin ci; then
    log "✅ Pull realizado com sucesso!"
else
    warn "⚠️ Erro ao fazer pull. Tentando reset hard..."
    git fetch origin ci
    git reset --hard origin/ci
    log "✅ Reset realizado com sucesso!"
fi

# Aplicar stash se houver
if git stash list | grep -q "Stash antes do pull"; then
    log "Aplicando stash..."
    git stash pop || warn "Não foi possível aplicar stash"
fi

# Verificar status final
log "Status final do repositório:"
git status --short

# Executar deploy
log "Executando deploy..."
if [ -f "deploy-vps-ci.sh" ]; then
    chmod +x deploy-vps-ci.sh
    ./deploy-vps-ci.sh
elif [ -f "deploy.sh" ]; then
    chmod +x deploy.sh
    ./deploy.sh
else
    warn "Script de deploy não encontrado. Executando docker compose diretamente..."
    if [ -f "deploy/docker-compose.ci.yml" ]; then
        docker compose -f deploy/docker-compose.ci.yml down
        docker compose -f deploy/docker-compose.ci.yml up -d --build
    else
        error "Arquivo docker-compose.ci.yml não encontrado"
    fi
fi

log "🎉 Processo concluído com sucesso!"

