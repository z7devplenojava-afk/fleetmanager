#!/bin/bash
# Script para corrigir senha do PostgreSQL na VPS

echo "🔧 Corrigindo senha do PostgreSQL na VPS..."

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    source .env
    echo "✅ Arquivo .env carregado"
else
    echo "⚠️ Arquivo .env não encontrado"
fi

# Verificar se POSTGRES_PASSWORD_CI está definido
if [ -z "$POSTGRES_PASSWORD_CI" ]; then
    echo "❌ POSTGRES_PASSWORD_CI não está definido!"
    echo "💡 Usando senha padrão: 4KaCiJc6an@7sgbdcid2025"
    POSTGRES_PASSWORD_CI="4KaCiJc6an@7sgbdcid2025"
fi

echo "🔐 Senha do PostgreSQL: ${POSTGRES_PASSWORD_CI:0:10}..."

# Parar containers
echo "🛑 Parando containers..."
docker-compose -f docker-compose.ci.yml down postgres-ci 2>/dev/null || true

# Remover volume do PostgreSQL (isso vai apagar os dados!)
echo "⚠️ ATENÇÃO: Isso vai apagar todos os dados do banco!"
read -p "Deseja continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

echo "🗑️ Removendo volume do PostgreSQL..."
docker volume rm fluxbus_postgres_data_ci 2>/dev/null || true

# Atualizar .env se necessário
if [ -f .env ]; then
    if ! grep -q "^POSTGRES_PASSWORD_CI=" .env; then
        echo "POSTGRES_PASSWORD_CI=$POSTGRES_PASSWORD_CI" >> .env
        echo "✅ POSTGRES_PASSWORD_CI adicionado ao .env"
    else
        sed -i "s|^POSTGRES_PASSWORD_CI=.*|POSTGRES_PASSWORD_CI=$POSTGRES_PASSWORD_CI|g" .env
        echo "✅ POSTGRES_PASSWORD_CI atualizado no .env"
    fi
else
    echo "POSTGRES_PASSWORD_CI=$POSTGRES_PASSWORD_CI" > .env
    echo "✅ Arquivo .env criado"
fi

# Iniciar PostgreSQL novamente
echo "🚀 Iniciando PostgreSQL com nova senha..."
docker-compose -f docker-compose.ci.yml up -d postgres-ci

echo "⏳ Aguardando PostgreSQL iniciar (30s)..."
sleep 30

# Verificar se está rodando
if docker ps | grep -q "fluxbus-db-ci"; then
    echo "✅ PostgreSQL está rodando!"
    echo "💡 A senha foi resetada. O banco foi recriado."
    echo "⚠️ Todos os dados anteriores foram perdidos!"
else
    echo "❌ PostgreSQL não está rodando!"
    echo "📋 Verificando logs..."
    docker logs fluxbus-db-ci --tail 50
    exit 1
fi

echo "✅ Correção concluída!"

