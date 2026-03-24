#!/bin/bash

# Script URGENTE para corrigir JWT_SECRET na VPS
# Execute na VPS: bash corrigir-jwt-urgente.sh

set -e

echo "🔧 =========================================="
echo "🔧 CORREÇÃO URGENTE DO JWT_SECRET"
echo "🔧 =========================================="
echo ""

# Valor padrão seguro (80 caracteres)
DEFAULT_JWT_SECRET="jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key"

cd /var/www/secured_guard/ci

echo "1️⃣ Verificando JWT_SECRET atual no container..."
JWT_CURRENT=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$JWT_CURRENT" ]; then
    JWT_LENGTH=${#JWT_CURRENT}
    echo "   Tamanho atual: $JWT_LENGTH caracteres"
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ❌ MUITO CURTO! Precisa corrigir."
    else
        echo "   ✅ Tamanho OK"
    fi
else
    echo "   ⚠️ JWT_SECRET não está definido no container"
fi

echo ""
echo "2️⃣ Removendo JWT_SECRET do ambiente do host..."
unset JWT_SECRET
sed -i '/^export JWT_SECRET=/d' ~/.bashrc 2>/dev/null || true
sed -i '/^export JWT_SECRET=/d' ~/.bash_profile 2>/dev/null || true
sed -i '/^export JWT_SECRET=/d' ~/.profile 2>/dev/null || true
echo "   ✅ Removido do ambiente do host"

echo ""
echo "3️⃣ Atualizando docker-compose.ci.yml..."
if [ ! -f "docker-compose.ci.yml" ]; then
    echo "   ❌ ERRO: docker-compose.ci.yml não encontrado!"
    exit 1
fi

# Atualizar a linha do JWT_SECRET com o valor padrão correto
sed -i "s|JWT_SECRET:.*|JWT_SECRET: \${JWT_SECRET:-$DEFAULT_JWT_SECRET}|g" docker-compose.ci.yml

# Verificar se foi atualizado
if grep -q "$DEFAULT_JWT_SECRET" docker-compose.ci.yml; then
    echo "   ✅ docker-compose.ci.yml atualizado com sucesso"
else
    echo "   ⚠️ Verificando formato atual do arquivo..."
    grep JWT_SECRET docker-compose.ci.yml || echo "   ⚠️ Linha JWT_SECRET não encontrada"
fi

echo ""
echo "4️⃣ Parando containers..."
docker-compose -f docker-compose.ci.yml down
echo "   ✅ Containers parados"

echo ""
echo "5️⃣ Removendo container antigo (se existir)..."
docker rm -f secured-guard-backend-ci 2>/dev/null || true
echo "   ✅ Container antigo removido"

echo ""
echo "6️⃣ Iniciando containers com nova configuração..."
export JWT_SECRET=""  # Garantir que não há valor no ambiente
docker-compose -f docker-compose.ci.yml up -d
echo "   ✅ Containers iniciados"

echo ""
echo "7️⃣ Aguardando backend iniciar (40s)..."
sleep 40

echo ""
echo "8️⃣ Verificando JWT_SECRET no novo container..."
MAX_RETRIES=5
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    JWT_NEW=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
    if [ -n "$JWT_NEW" ]; then
        JWT_LENGTH=${#JWT_NEW}
        echo "   ✅ JWT_SECRET encontrado: $JWT_LENGTH caracteres"
        
        if [ $JWT_LENGTH -lt 64 ]; then
            echo "   ❌ ERRO: Ainda muito curto! ($JWT_LENGTH caracteres)"
            echo "   Valor atual (primeiros 30): ${JWT_NEW:0:30}..."
            exit 1
        else
            echo "   ✅ Tamanho correto! ($JWT_LENGTH caracteres)"
            echo "   Primeiros 30 caracteres: ${JWT_NEW:0:30}..."
            break
        fi
    else
        RETRY=$((RETRY + 1))
        if [ $RETRY -lt $MAX_RETRIES ]; then
            echo "   ⏳ Aguardando container iniciar... (tentativa $RETRY/$MAX_RETRIES)"
            sleep 10
        else
            echo "   ❌ ERRO: JWT_SECRET não encontrado após $MAX_RETRIES tentativas"
            echo "   Verificando logs do backend..."
            docker logs --tail=30 secured-guard-backend-ci
            exit 1
        fi
    fi
done

echo ""
echo "9️⃣ Verificando logs do backend para erros de JWT..."
docker logs --tail=50 secured-guard-backend-ci 2>&1 | grep -i -E "(jwt|token|signing|chave)" | tail -10 || echo "   Nenhum erro de JWT encontrado nos logs recentes"

echo ""
echo "🔟 Testando endpoint de health..."
HEALTH_RESPONSE=$(docker exec secured-guard-backend-ci curl -s http://localhost:8081/api/health 2>/dev/null || echo "")
if [ -n "$HEALTH_RESPONSE" ]; then
    echo "   ✅ Backend está respondendo"
else
    echo "   ⚠️ Backend pode não estar totalmente iniciado"
fi

echo ""
echo "✅ =========================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "✅ =========================================="
echo ""
echo "📋 Resumo:"
echo "   - JWT_SECRET atualizado para $JWT_LENGTH caracteres"
echo "   - Container reiniciado"
echo "   - Teste o login novamente"
echo ""
echo "🔍 Se ainda houver erro, verifique os logs:"
echo "   docker logs --tail=100 secured-guard-backend-ci | grep -i jwt"

