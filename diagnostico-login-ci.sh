#!/bin/bash
# Script para diagnosticar erro 500 no login do CI

echo "=== DIAGNÓSTICO LOGIN CI ==="
echo ""

# 1. Verificar containers rodando
echo "1. Containers ativos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Logs do backend (últimas 100 linhas com erros)
echo "2. Logs do backend (erros):"
docker logs fluxbus-backend-ci --tail 100 2>&1 | grep -E "ERROR|Exception|login|authenticate"
echo ""

# 3. Verificar conectividade com banco
echo "3. Teste de conexão com banco:"
docker exec fluxbus-backend-ci pg_isready -h postgres-ci -U fluxbus_user
echo ""

# 4. Verificar usuários no banco sem roles
echo "4. Usuários sem roles:"
docker exec fluxbus-postgres-ci psql -U fluxbus_user -d fluxbus -c "
SELECT u.username, u.email, COUNT(ur.role_id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.username, u.email
HAVING COUNT(ur.role_id) = 0
LIMIT 10;"
echo ""

# 5. Verificar role COLABORADOR existe
echo "5. Verificar role COLABORADOR:"
docker exec fluxbus-postgres-ci psql -U fluxbus_user -d fluxbus -c "
SELECT * FROM roles WHERE name = 'COLABORADOR';"
echo ""

echo "=== FIM DO DIAGNÓSTICO ==="
