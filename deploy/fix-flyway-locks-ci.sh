#!/bin/bash

# =====================================================
# SCRIPT PARA LIBERAR LOCKS ÓRFÃOS DO FLYWAY NO CI
# Execute este script no servidor quando o Flyway
# estiver travado tentando obter locks
# =====================================================

echo "🔓 Liberando locks órfãos do Flyway no banco CI..."

# Parar o backend temporariamente
echo "⏹️ Parando backend CI..."
docker-compose -f docker-compose.ci.yml stop backend-ci

# Aguardar um pouco para garantir que todas as conexões foram fechadas
sleep 5

# Conectar ao banco e liberar locks
echo "🔓 Liberando advisory locks..."
docker exec secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT pg_advisory_unlock_all();"

# Verificar locks restantes
echo "🔍 Verificando locks restantes..."
docker exec secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "
SELECT 
    locktype,
    database,
    mode,
    granted
FROM pg_locks
WHERE locktype = 'advisory';
"

# Reiniciar o backend
echo "🚀 Reiniciando backend CI..."
docker-compose -f docker-compose.ci.yml start backend-ci

echo "✅ Processo concluído!"
echo "📋 Verifique os logs do backend:"
echo "   docker logs -f secured-guard-backend-ci"

