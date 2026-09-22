#!/bin/bash

# Script para corrigir JWT_SECRET na VPS
# Execute na VPS: bash corrigir-jwt-vps.sh

echo "🔐 Corrigindo JWT_SECRET na VPS..."

cd /var/www/fluxbus/ci

# Valor correto do JWT_SECRET (80 caracteres)
CORRECT_JWT_SECRET="jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key"

echo ""
echo "1️⃣ Verificando arquivo .env..."
if [ -f .env ]; then
    CURRENT_JWT=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
    CURRENT_LENGTH=${#CURRENT_JWT}
    echo "   JWT_SECRET atual no .env: ${CURRENT_JWT:0:20}... (${CURRENT_LENGTH} caracteres)"
    
    if [ $CURRENT_LENGTH -lt 64 ]; then
        echo "   ⚠️ JWT_SECRET muito curto! Corrigindo..."
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${CORRECT_JWT_SECRET}|g" .env
        echo "   ✅ JWT_SECRET corrigido no .env"
    else
        echo "   ✅ JWT_SECRET no .env está OK"
    fi
else
    echo "   ⚠️ Arquivo .env não encontrado! Criando..."
    echo "JWT_SECRET=${CORRECT_JWT_SECRET}" >> .env
    echo "   ✅ Arquivo .env criado"
fi

echo ""
echo "2️⃣ Verificando docker-compose.ci.yml..."
if grep -q "JWT_SECRET.*jwt_secret_ci_2025[^_]" docker-compose.ci.yml; then
    echo "   ⚠️ JWT_SECRET curto encontrado no docker-compose.ci.yml"
    echo "   ℹ️ O docker-compose.ci.yml já deve ter o valor correto do GitHub"
else
    echo "   ✅ docker-compose.ci.yml parece estar OK"
fi

echo ""
echo "3️⃣ Verificando variável de ambiente no host..."
if [ -n "$JWT_SECRET" ]; then
    HOST_LENGTH=${#JWT_SECRET}
    echo "   ⚠️ JWT_SECRET definido no host: ${JWT_SECRET:0:20}... (${HOST_LENGTH} caracteres)"
    if [ $HOST_LENGTH -lt 64 ]; then
        echo "   ⚠️ JWT_SECRET do host é muito curto! Removendo..."
        unset JWT_SECRET
        # Remover de arquivos de configuração do shell
        sed -i '/^export JWT_SECRET=/d' ~/.bashrc 2>/dev/null || true
        sed -i '/^export JWT_SECRET=/d' ~/.bash_profile 2>/dev/null || true
        sed -i '/^export JWT_SECRET=/d' ~/.profile 2>/dev/null || true
        echo "   ✅ JWT_SECRET removido do ambiente do host"
    fi
else
    echo "   ✅ JWT_SECRET não está definido no host (usando do .env ou docker-compose)"
fi

echo ""
echo "4️⃣ Verificando JWT_SECRET no container backend..."
CONTAINER_JWT=$(docker exec fluxbus-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$CONTAINER_JWT" ]; then
    CONTAINER_LENGTH=${#CONTAINER_JWT}
    echo "   JWT_SECRET no container: ${CONTAINER_JWT:0:20}... (${CONTAINER_LENGTH} caracteres)"
    if [ $CONTAINER_LENGTH -lt 64 ]; then
        echo "   ⚠️ JWT_SECRET no container é muito curto!"
    else
        echo "   ✅ JWT_SECRET no container está OK"
    fi
else
    echo "   ⚠️ JWT_SECRET não encontrado no container"
fi

echo ""
echo "5️⃣ Reiniciando containers para aplicar mudanças..."
docker-compose -f docker-compose.ci.yml down
sleep 5
docker-compose -f docker-compose.ci.yml up -d

echo ""
echo "6️⃣ Aguardando backend iniciar..."
sleep 30

echo ""
echo "7️⃣ Verificando JWT_SECRET após reinício..."
NEW_CONTAINER_JWT=$(docker exec fluxbus-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$NEW_CONTAINER_JWT" ]; then
    NEW_LENGTH=${#NEW_CONTAINER_JWT}
    echo "   JWT_SECRET no container: ${NEW_CONTAINER_JWT:0:20}... (${NEW_LENGTH} caracteres)"
    if [ $NEW_LENGTH -ge 64 ]; then
        echo "   ✅ JWT_SECRET corrigido com sucesso!"
    else
        echo "   ❌ JWT_SECRET ainda está muito curto!"
        echo "   🔍 Verificando logs do backend..."
        docker logs fluxbus-backend-ci --tail 20 | grep -i jwt || echo "   Nenhum log JWT encontrado"
    fi
else
    echo "   ⚠️ JWT_SECRET não encontrado no container após reinício"
fi

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📋 Para verificar manualmente:"
echo "   docker exec fluxbus-backend-ci printenv JWT_SECRET | wc -c"
echo "   (deve mostrar 81: 80 caracteres + 1 newline)"

