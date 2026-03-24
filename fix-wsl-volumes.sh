#!/bin/bash
# Script para corrigir volumes no WSL e limpar estado antigo

set -e

echo "🔧 Corrigindo volumes Docker no WSL..."

# Parar e remover containers antigos
echo "📦 Parando containers existentes..."
docker-compose -f docker-compose.ci.yml down -v 2>/dev/null || true

# Remover containers órfãos que podem estar causando conflito
echo "🧹 Removendo containers órfãos..."
docker container prune -f

# Verificar se há volumes órfãos com o padrão antigo
echo "🗑️  Limpando volumes antigos..."
docker volume ls | grep -E "secured_guard.*ci" | awk '{print $2}' | xargs -r docker volume rm || true

# Criar redes se não existirem
echo "🔗 Criando redes..."
docker network create secured-guard-ci-network 2>/dev/null || true
docker network create z7network 2>/dev/null || true

echo "✅ Limpeza concluída!"
echo ""
echo "Agora você pode executar:"
echo "  docker-compose -f docker-compose.ci.yml up -d"





