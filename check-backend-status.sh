#!/bin/bash

# Script para verificar o status do backend e diagnosticar problemas
# Execute: bash check-backend-status.sh

echo "🔍 Verificando status do backend..."

# Verificar status dos containers
echo ""
echo "📋 Status dos containers:"
docker-compose -f docker-compose.ci.yml ps

# Verificar logs do backend
echo ""
echo "📋 Últimas 50 linhas dos logs do backend:"
docker-compose -f docker-compose.ci.yml logs --tail=50 backend-ci

# Verificar se o backend está respondendo
echo ""
echo "🌐 Testando endpoint de health do backend:"
curl -s http://localhost:8081/api/health || echo "❌ Backend não está respondendo"

# Verificar logs de erro
echo ""
echo "🔴 Últimas 20 linhas de ERRO dos logs do backend:"
docker-compose -f docker-compose.ci.yml logs --tail=100 backend-ci | grep -i error || echo "✅ Nenhum erro encontrado nos logs recentes"

# Verificar uso de recursos
echo ""
echo "💻 Uso de recursos do backend:"
docker stats secured-guard-backend-ci --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Verificar conectividade com o banco
echo ""
echo "🗄️  Verificando conectividade com o banco de dados:"
docker-compose -f docker-compose.ci.yml exec -T backend-ci ping -c 1 secured-guard-db-ci 2>/dev/null || echo "⚠️  Não foi possível testar conectividade"

echo ""
echo "✅ Verificação concluída!"

