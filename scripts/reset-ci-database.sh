#!/bin/bash

##########################################################
# Script para Resetar Completamente o Banco CI
##########################################################

set -e  # Sair em caso de erro

echo "🗑️  Resetando banco de dados CI..."
echo ""

# Diretório do CI na VPS
CI_DIR="/var/www/secured_guard/ci"

echo "📍 Diretório: $CI_DIR"
echo ""

# Parar todos os containers
echo "⏹️  Parando containers..."
cd $CI_DIR
docker-compose down

echo ""
echo "🗑️  Removendo volumes (incluindo dados do PostgreSQL)..."
docker-compose down -v

echo ""
echo "🧹 Limpando arquivos de volume órfãos..."
docker volume prune -f

echo ""
echo "🔍 Verificando se ainda existem volumes do secured-guard-ci..."
docker volume ls | grep secured-guard-ci || echo "✅ Nenhum volume encontrado"

echo ""
echo "🚀 Recriando containers do zero..."
docker-compose up -d

echo ""
echo "⏳ Aguardando 30 segundos para o banco inicializar..."
sleep 30

echo ""
echo "🔍 Status dos containers:"
docker-compose ps

echo ""
echo "📋 Verificando logs do backend (últimas 50 linhas):"
docker-compose logs --tail=50 backend-ci

echo ""
echo "✅ Reset completo! O Flyway deve rodar todas as migrations do zero agora."
echo ""
echo "🔗 Teste o acesso: https://ci.z7botsolutions.com.br"
