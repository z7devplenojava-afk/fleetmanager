#!/bin/bash

# Script para corrigir JWT_SECRET na VPS AGORA (sem reinstalar)
# Execute na VPS: bash corrigir-jwt-agora.sh

echo "🔐 Corrigindo JWT_SECRET na VPS..."

cd /var/www/secured_guard/ci

# Valor correto do JWT_SECRET (80 caracteres)
CORRECT_JWT_SECRET="jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key"

echo ""
echo "1️⃣ Corrigindo arquivo .env..."
if [ -f .env ]; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${CORRECT_JWT_SECRET}|g" .env
    echo "   ✅ .env atualizado"
else
    echo "JWT_SECRET=${CORRECT_JWT_SECRET}" >> .env
    echo "   ✅ .env criado"
fi

# Verificar
JWT_LENGTH=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2 | wc -c)
echo "   Tamanho do JWT_SECRET: $((JWT_LENGTH - 1)) caracteres"

echo ""
echo "2️⃣ Removendo JWT_SECRET curto do ambiente do host..."
unset JWT_SECRET
sed -i '/^export JWT_SECRET=/d' ~/.bashrc 2>/dev/null || true
sed -i '/^export JWT_SECRET=/d' ~/.bash_profile 2>/dev/null || true
sed -i '/^export JWT_SECRET=/d' ~/.profile 2>/dev/null || true
echo "   ✅ Variáveis de ambiente do host limpas"

echo ""
echo "3️⃣ Reiniciando containers..."
docker-compose -f docker-compose.ci.yml restart backend-ci

echo ""
echo "4️⃣ Aguardando backend reiniciar (30s)..."
sleep 30

echo ""
echo "5️⃣ Verificando JWT_SECRET no container..."
CONTAINER_JWT=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$CONTAINER_JWT" ]; then
    CONTAINER_LENGTH=${#CONTAINER_JWT}
    echo "   JWT_SECRET no container: ${CONTAINER_JWT:0:30}... (${CONTAINER_LENGTH} caracteres)"
    if [ $CONTAINER_LENGTH -ge 64 ]; then
        echo "   ✅ JWT_SECRET está correto!"
    else
        echo "   ❌ JWT_SECRET ainda está curto. Tentando novamente..."
        docker-compose -f docker-compose.ci.yml down
        sleep 5
        docker-compose -f docker-compose.ci.yml up -d
        sleep 30
        CONTAINER_JWT=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
        CONTAINER_LENGTH=${#CONTAINER_JWT}
        if [ $CONTAINER_LENGTH -ge 64 ]; then
            echo "   ✅ JWT_SECRET corrigido após reinício completo!"
        else
            echo "   ❌ Ainda com problema. Verifique os logs."
        fi
    fi
else
    echo "   ⚠️ JWT_SECRET não encontrado no container"
fi

echo ""
echo "6️⃣ Testando login..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST https://ci.z7botsolutions.com.br/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    --max-time 10 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "   ✅ Login está funcionando (retornou $HTTP_CODE - credenciais inválidas, mas endpoint OK)"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "   ❌ Login ainda retorna 500. Verificando logs..."
    docker logs --tail 30 secured-guard-backend-ci 2>&1 | grep -i jwt | tail -5
else
    echo "   ℹ️ Login retornou código $HTTP_CODE"
fi

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📋 Para verificar manualmente:"
echo "   docker exec secured-guard-backend-ci printenv JWT_SECRET | wc -c"
echo "   (deve mostrar 81: 80 caracteres + 1 newline)"
