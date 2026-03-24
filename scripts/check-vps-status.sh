#!/bin/bash

# ===================== SCRIPT PARA VERIFICAR STATUS DA VPS =====================
# Execute este script na VPS para verificar o status completo

echo "🔍 Verificando status da VPS SecuredGuard..."
echo ""

# Verificar containers Docker
echo "🐳 Containers Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Verificar logs do backend
echo "📋 Logs do Backend (últimas 20 linhas):"
docker logs --tail 20 secured-guard-backend-1 2>/dev/null || echo "   ❌ Backend não encontrado"
echo ""

# Verificar logs do PostgreSQL
echo "🗄️ Logs do PostgreSQL (últimas 10 linhas):"
docker logs --tail 10 secured-guard-postgres-1 2>/dev/null || echo "   ❌ PostgreSQL não encontrado"
echo ""

# Verificar bancos de dados
echo "📊 Bancos de dados disponíveis:"
docker exec secured-guard-postgres-1 psql -U postgressg -d postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'secured_guard%';" 2>/dev/null || echo "   ❌ Não foi possível conectar no PostgreSQL"
echo ""

# Verificar se backend está respondendo
echo "🌐 Testando endpoint do backend:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/actuator/health 2>/dev/null || echo "   ❌ Backend não está respondendo"
echo ""

# Verificar uso de recursos
echo "💾 Uso de recursos:"
echo "   CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "   Memória: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "   Disco: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " usado)"}')"
echo ""

echo "✅ Verificação concluída!"
