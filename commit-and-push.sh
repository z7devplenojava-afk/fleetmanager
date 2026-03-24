#!/bin/bash

# Script para fazer commit e push das alterações
# Execute: bash commit-and-push.sh

set -e

echo "📝 Verificando status do repositório..."
git status

echo ""
echo "📦 Adicionando arquivos modificados..."
git add fix-docker-swarm-issue.sh
git add .github/workflows/deploy-ci-docker.yml

echo ""
echo "📝 Fazendo commit..."
git commit -m "fix: corrigir problemas com Docker Swarm e criação de containers CI

- Adicionar script de correção para problemas com Docker Swarm
- Atualizar workflow para suportar docker compose v2 e v1
- Adicionar limpeza de containers órfãos antes de iniciar
- Melhorar tratamento de erros e verificação de imagens
- Usar --force-recreate --remove-orphans para evitar conflitos"

echo ""
echo "🚀 Fazendo push..."
git push origin ci

echo ""
echo "✅ Commit e push concluídos com sucesso!"

