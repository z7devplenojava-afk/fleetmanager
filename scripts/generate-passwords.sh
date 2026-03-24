#!/bin/bash

# ===================== SCRIPT PARA GERAR SENHAS SEGURAS =====================
# Este script gera senhas seguras para todos os ambientes

echo "🔐 Gerando senhas seguras para o projeto SecuredGuard..."
echo ""

# Função para gerar senha segura
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Função para gerar JWT secret
generate_jwt_secret() {
    openssl rand -hex 64
}

echo "=== SENHAS GERADAS ==="
echo ""

echo "# Banco de Dados"
echo "POSTGRES_PASSWORD=$(generate_password 32)"
echo ""

echo "# Redis Cache"
echo "REDIS_PASSWORD=$(generate_password 24)"
echo ""

echo "# JWT Secret"
echo "JWT_SECRET=$(generate_jwt_secret)"
echo ""

echo "=== INSTRUÇÕES ==="
echo "1. Copie as senhas acima"
echo "2. Cole nos arquivos .env correspondentes"
echo "3. NUNCA commite senhas no Git"
echo "4. Mantenha as senhas em local seguro"
echo ""

echo "✅ Senhas geradas com sucesso!"
