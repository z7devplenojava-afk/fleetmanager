#!/bin/bash

# Script para corrigir JWT_SECRET no arquivo .env
# Execute na VPS: bash corrigir-env-jwt.sh

echo "🔧 Corrigindo JWT_SECRET no arquivo .env..."

cd /var/www/secured_guard/ci

# Valor padrão seguro (80 caracteres)
DEFAULT_JWT_SECRET="jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key"

# Verificar se .env existe
if [ -f ".env" ]; then
    echo "📝 Arquivo .env encontrado. Atualizando JWT_SECRET..."
    
    # Atualizar ou adicionar JWT_SECRET no .env
    if grep -q "^JWT_SECRET=" .env; then
        # Substituir linha existente
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$DEFAULT_JWT_SECRET|g" .env
        echo "✅ JWT_SECRET atualizado no .env"
    else
        # Adicionar nova linha
        echo "JWT_SECRET=$DEFAULT_JWT_SECRET" >> .env
        echo "✅ JWT_SECRET adicionado ao .env"
    fi
    
    # Verificar se foi atualizado corretamente
    JWT_IN_ENV=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
    JWT_LENGTH=${#JWT_IN_ENV}
    echo "   Tamanho do JWT_SECRET no .env: $JWT_LENGTH caracteres"
    
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ❌ ERRO: JWT_SECRET no .env ainda é muito curto!"
        exit 1
    else
        echo "   ✅ JWT_SECRET no .env está correto"
    fi
else
    echo "⚠️ Arquivo .env não encontrado. Criando..."
    echo "JWT_SECRET=$DEFAULT_JWT_SECRET" > .env
    chmod 600 .env
    echo "✅ Arquivo .env criado com JWT_SECRET correto"
fi

echo ""
echo "🔄 Reiniciando containers..."
docker-compose -f docker-compose.ci.yml up -d

echo ""
echo "⏳ Aguardando containers iniciarem (40s)..."
sleep 40

echo ""
echo "✅ Verificando JWT_SECRET no container..."
JWT_IN_CONTAINER=$(docker exec secured-guard-backend-ci printenv JWT_SECRET 2>/dev/null || echo "")
if [ -n "$JWT_IN_CONTAINER" ]; then
    JWT_LENGTH=${#JWT_IN_CONTAINER}
    echo "   JWT_SECRET no container: $JWT_LENGTH caracteres"
    
    if [ $JWT_LENGTH -lt 64 ]; then
        echo "   ❌ ERRO: JWT_SECRET no container ainda é muito curto!"
        echo "   Valor: ${JWT_IN_CONTAINER:0:30}..."
        exit 1
    else
        echo "   ✅ JWT_SECRET no container está correto!"
        echo "   Primeiros 30 caracteres: ${JWT_IN_CONTAINER:0:30}..."
    fi
else
    echo "   ❌ ERRO: JWT_SECRET não está definido no container!"
    exit 1
fi

echo ""
echo "✅ Correção concluída! Teste o login novamente."

