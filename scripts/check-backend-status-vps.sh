#!/bin/bash
# Script para verificar status do backend na VPS

echo "🔍 Verificando status do backend na VPS..."
echo ""

cd /var/www/fluxbus/ci || {
    echo "❌ Diretório /var/www/fluxbus/ci não encontrado!"
    exit 1
}

# 1. Verificar containers
echo "📋 1. Status dos containers:"
docker-compose -f docker-compose.ci.yml ps
echo ""

# 2. Verificar se backend está rodando
echo "📋 2. Verificando container do backend:"
if docker ps | grep -q "fluxbus-backend-ci"; then
    echo "✅ Container backend está rodando"
    docker ps --filter "name=fluxbus-backend-ci" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Container backend NÃO está rodando!"
    echo "📋 Verificando se existe:"
    docker ps -a --filter "name=fluxbus-backend-ci"
fi
echo ""

# 3. Verificar logs do backend
echo "📋 3. Últimas 50 linhas dos logs do backend:"
docker logs --tail 50 fluxbus-backend-ci 2>&1 | tail -50 || echo "⚠️ Não foi possível obter logs"
echo ""

# 4. Verificar PostgreSQL
echo "📋 4. Verificando PostgreSQL:"
if docker ps | grep -q "fluxbus-db-ci"; then
    echo "✅ PostgreSQL está rodando"
    # Testar conexão
    echo "🔍 Testando conexão com PostgreSQL..."
    docker exec fluxbus-db-ci psql -U fluxbus_ci -d fluxbus_ci -c "SELECT version();" 2>&1 || echo "❌ Erro ao conectar ao PostgreSQL"
else
    echo "❌ PostgreSQL NÃO está rodando!"
fi
echo ""

# 5. Verificar Redis
echo "📋 5. Verificando Redis:"
if docker ps | grep -q "fluxbus-redis-ci"; then
    echo "✅ Redis está rodando"
    # Testar conexão
    echo "🔍 Testando conexão com Redis..."
    docker exec fluxbus-redis-ci redis-cli -a "${REDIS_PASSWORD:-redis_ci_2025}" ping 2>&1 || echo "❌ Erro ao conectar ao Redis"
else
    echo "❌ Redis NÃO está rodando!"
fi
echo ""

# 6. Verificar variáveis de ambiente
echo "📋 6. Verificando variáveis de ambiente do backend:"
docker exec fluxbus-backend-ci printenv | grep -E "(SPRING_DATASOURCE|JWT_SECRET|POSTGRES)" || echo "⚠️ Container não está rodando ou não foi possível obter variáveis"
echo ""

# 7. Verificar arquivo .env
echo "📋 7. Verificando arquivo .env:"
if [ -f .env ]; then
    echo "✅ Arquivo .env existe"
    echo "📋 POSTGRES_PASSWORD_CI:"
    grep "^POSTGRES_PASSWORD_CI=" .env | sed 's/=.*/=***/' || echo "⚠️ POSTGRES_PASSWORD_CI não encontrado no .env"
else
    echo "❌ Arquivo .env não encontrado!"
fi
echo ""

# 8. Verificar conectividade de rede
echo "📋 8. Verificando conectividade de rede:"
echo "🔍 Backend → PostgreSQL:"
docker exec fluxbus-backend-ci ping -c 2 postgres-ci 2>&1 | head -5 || echo "❌ Não foi possível fazer ping"
echo ""
echo "🔍 Backend → Redis:"
docker exec fluxbus-backend-ci ping -c 2 redis-ci 2>&1 | head -5 || echo "❌ Não foi possível fazer ping"
echo ""

# 9. Verificar porta do backend
echo "📋 9. Verificando se backend está escutando na porta:"
netstat -tlnp 2>/dev/null | grep ":8081" || ss -tlnp 2>/dev/null | grep ":8081" || echo "⚠️ Backend não está escutando na porta 8081"
echo ""

# 10. Testar health check
echo "📋 10. Testando health check do backend:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8081/api/health || echo "❌ Backend não responde"
echo ""

echo "✅ Diagnóstico concluído!"

