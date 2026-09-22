#!/bin/bash

# ===================== SCRIPT PARA CRIAR BANCOS FALTANTES =====================
# Execute este script na VPS para criar os bancos que estão faltando

echo "🔧 Criando bancos de dados faltantes..."
echo ""

# Configurações
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgressg}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx}

# Lista de bancos faltantes
MISSING_DATABASES=(
    "fluxbus_dev"
    "fluxbus_test"
    "fluxbus_staging"
    "fluxbus_ci"
)

# Função para criar banco
create_database() {
    local db_name=$1
    echo "📊 Criando banco: $db_name"
    
    # Verificar se o banco já existe
    if psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw $db_name; then
        echo "   ✅ Banco $db_name já existe"
    else
        # Criar o banco
        createdb -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER $db_name
        if [ $? -eq 0 ]; then
            echo "   ✅ Banco $db_name criado com sucesso"
        else
            echo "   ❌ Erro ao criar banco $db_name"
            return 1
        fi
    fi
}

# Verificar se PostgreSQL está rodando
echo "🔍 Verificando conexão com PostgreSQL..."
if pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; then
    echo "   ✅ PostgreSQL está acessível"
else
    echo "   ❌ PostgreSQL não está acessível"
    echo "   Verifique se o PostgreSQL está rodando"
    exit 1
fi
echo ""

# Criar bancos faltantes
echo "🏗️ Criando bancos de dados..."
for db in "${MISSING_DATABASES[@]}"; do
    create_database $db
done
echo ""

# Verificar bancos criados
echo "📋 Verificando bancos criados..."
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'fluxbus%';"
echo ""

echo "✅ Script concluído!"
echo ""
echo "🔗 Para conectar via DBeaver:"
echo "  Host: $POSTGRES_HOST"
echo "  Porta: $POSTGRES_PORT"
echo "  Username: $POSTGRES_USER"
echo "  Password: $POSTGRES_PASSWORD"
