#!/bin/bash

# ========================================
# DIAGNÓSTICO COMPLETO EVOLUTION API
# ========================================

echo "========================================"
echo "  🔍 DIAGNÓSTICO EVOLUTION API"
echo "========================================"
echo ""

# Conectar ao servidor
ssh root@ci.z7botsolutions.com.br << 'ENDSSH'

echo "1. Verificando status do container..."
docker ps | grep evolution-api-ci
echo ""

echo "2. Verificando logs (últimas 100 linhas)..."
echo "=========================================="
docker logs evolution-api-ci --tail 100
echo ""
echo "=========================================="
echo ""

echo "3. Contando ocorrências de ChannelStartupService..."
LOOP_COUNT=$(docker logs evolution-api-ci --tail 100 | grep -c "ChannelStartupService" || echo "0")
echo "   Encontradas: $LOOP_COUNT vezes"
echo ""

if [ "$LOOP_COUNT" -gt 10 ]; then
    echo "   ❌ LOOP CONFIRMADO!"
    echo ""
    echo "4. Identificando causa do loop..."
    echo ""
    
    # Verificar se é problema de Redis
    echo "   A) Testando Redis..."
    docker exec fluxbus-redis-ci redis-cli -a redis_ci_2025 ping && echo "      ✅ Redis OK" || echo "      ❌ Redis com problema"
    echo ""
    
    # Verificar se é problema de banco
    echo "   B) Testando PostgreSQL..."
    docker exec fluxbus-db-ci psql -U fluxbus_ci -d evolution_ci -c "SELECT 1;" && echo "      ✅ PostgreSQL OK" || echo "      ❌ PostgreSQL com problema"
    echo ""
    
    # Verificar variáveis de ambiente
    echo "   C) Verificando variáveis de ambiente..."
    docker exec evolution-api-ci env | grep -E "DATABASE|REDIS|SERVER_URL|CONFIG_SESSION"
    echo ""
    
    echo "5. SOLUÇÃO: Tentar recriar sem cache..."
else
    echo "   ✅ SEM LOOP (apenas $LOOP_COUNT vezes)"
    echo ""
    echo "4. Problema diferente - verificando instâncias..."
    docker exec evolution-api-ci ls -la /evolution/instances/ || echo "   Erro ao acessar diretório"
    echo ""
fi

echo ""
echo "========================================"
echo "  📊 RESUMO"
echo "========================================"
echo ""
echo "Status Container: $(docker ps | grep evolution-api-ci > /dev/null && echo 'Rodando' || echo 'Parado')"
echo "Loop Detectado: $([ $LOOP_COUNT -gt 10 ] && echo 'SIM' || echo 'NÃO')"
echo "Ocorrências ChannelStartup: $LOOP_COUNT"
echo ""

ENDSSH

echo ""
echo "========================================"
echo "  PRÓXIMOS PASSOS"
echo "========================================"
echo ""
echo "Baseado no diagnóstico acima, escolha:"
echo ""
echo "A) Se LOOP confirmado:"
echo "   - Desabilitar Redis (usar cache local)"
echo "   - Ou desabilitar banco (usar filesystem)"
echo ""
echo "B) Se SEM LOOP mas QR vazio:"
echo "   - Deletar e recriar instância"
echo "   - Verificar permissões de diretório"
echo ""

