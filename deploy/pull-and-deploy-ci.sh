#!/bin/bash

# Script para fazer pull e deploy na VPS - Ambiente CI
# Execute este script na VPS

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

log "🚀 Iniciando pull e deploy na VPS - Ambiente CI..."

# Verificar se estamos no diretório correto
if [ ! -d ".git" ]; then
    error "Este script deve ser executado no diretório raiz do repositório Git"
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
log "Branch atual: $CURRENT_BRANCH"

# Verificar se está na branch ci
if [ "$CURRENT_BRANCH" != "ci" ]; then
    warn "Você não está na branch 'ci'. Mudando para branch 'ci'..."
    git checkout ci || error "Não foi possível mudar para branch 'ci'"
fi

# Verificar status do repositório
log "Verificando status do repositório..."
git status

# Tentar fazer stash de mudanças locais (se houver)
if ! git diff-index --quiet HEAD --; then
    warn "Há mudanças locais não commitadas. Fazendo stash..."
    git stash save "Stash antes do pull - $(date +'%Y-%m-%d %H:%M:%S')"
fi

# Tentar fazer pull
log "Fazendo pull da branch 'ci'..."
if git pull origin ci; then
    log "✅ Pull realizado com sucesso!"
else
    warn "⚠️ Erro ao fazer pull. Tentando diferentes estratégias..."
    
    # Estratégia 1: Verificar se há conflitos
    if [ -f ".git/MERGE_HEAD" ]; then
        warn "Há um merge em andamento. Abortando merge..."
        git merge --abort || true
    fi
    
    # Estratégia 2: Reset hard (CUIDADO: isso descarta mudanças locais)
    read -p "Deseja fazer reset hard para a branch remota? (isso descartará mudanças locais) [s/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        warn "Fazendo reset hard..."
        git fetch origin ci
        git reset --hard origin/ci
        log "✅ Reset realizado com sucesso!"
    else
        error "Pull falhou. Resolva os conflitos manualmente ou use 'git reset --hard origin/ci'"
    fi
fi

# Aplicar stash se houver
if git stash list | grep -q "Stash antes do pull"; then
    log "Aplicando stash..."
    git stash pop || warn "Não foi possível aplicar stash. Verifique manualmente com 'git stash list'"
fi

# Verificar se há arquivos não rastreados
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)
if [ "$UNTRACKED" -gt 0 ]; then
    warn "Há $UNTRACKED arquivo(s) não rastreado(s). Eles não serão afetados pelo deploy."
fi

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
    docker compose -f deploy/docker-compose.ci.yml down
    docker compose -f deploy/docker-compose.ci.yml up -d --build
fi

log "🎉 Processo concluído!"

