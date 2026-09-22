#!/bin/bash

# Script para verificar e corrigir o JWT_SECRET
# Execute na VPS: bash fix-jwt-secret.sh

echo "🔍 Verificando configuração do JWT_SECRET..."
echo ""

echo "1️⃣ Verificando variável JWT_SECRET no host..."
if [ -z "$JWT_SECRET" ]; then
    echo "⚠️ JWT_SECRET não está definida no host"
else
    echo "✅ JWT_SECRET está definida: ${JWT_SECRET:0:20}... (${#JWT_SECRET} caracteres)"
fi

echo ""
echo "2️⃣ Verificando JWT_SECRET no container..."
docker exec fluxbus-backend-ci printenv | grep JWT_SECRET

echo ""
echo "3️⃣ Verificando o tamanho da chave JWT no container..."
JWT_SECRET_IN_CONTAINER=$(docker exec fluxbus-backend-ci printenv JWT_SECRET)
if [ -z "$JWT_SECRET_IN_CONTAINER" ]; then
    echo "❌ JWT_SECRET não está definida no container!"
    echo ""
    echo "🔧 Solução: Definir a variável de ambiente no host ou usar o valor padrão do docker-compose"
else
    LENGTH=${#JWT_SECRET_IN_CONTAINER}
    echo "📏 Tamanho da chave: $LENGTH caracteres"
    if [ $LENGTH -lt 64 ]; then
        echo "❌ ERRO: Chave muito curta! Precisa de pelo menos 64 caracteres para HS512"
    else
        echo "✅ Chave tem tamanho adequado"
    fi
fi

echo ""
echo "4️⃣ Valor atual da chave (primeiros 30 caracteres):"
docker exec fluxbus-backend-ci printenv JWT_SECRET | head -c 30
echo "..."

echo ""
echo "5️⃣ Para corrigir, execute um dos comandos abaixo:"
echo ""
echo "   Opção 1: Definir no host e reiniciar o container:"
echo "   export JWT_SECRET='jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure'"
echo "   docker-compose -f docker-compose.ci.yml restart backend-ci"
echo ""
echo "   Opção 2: Editar o docker-compose.ci.yml e garantir que o valor padrão está correto"
echo "   (já está correto na linha 67)"

