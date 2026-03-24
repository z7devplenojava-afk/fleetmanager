#!/bin/bash

# ===================== SCRIPT PARA VERIFICAR BANCOS DE DADOS =====================

echo "🔍 Verificando bancos de dados SecuredGuard..."
echo ""

# Configurações
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgressg}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx}

# Lista de bancos esperados
EXPECTED_DATABASES=(
    "secured_guard_dev"
    "secured_guard_test"
    "secured_guard_staging"
    "secured_guard_prod"
    "secured_guard_ci"
)

# Função para verificar banco
check_database() {
    local db_name=$1
    echo "📊 Verificando banco: $db_name"
    
    # Verificar se o banco existe
    if psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1; then
        echo "   ✅ Banco $db_name existe"
        
        # Verificar se consegue conectar
        if psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db_name -c "SELECT 1;" &> /dev/null; then
            echo "   ✅ Conexão com $db_name funcionando"
            
            # Verificar tabelas
            local table_count=$(psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db_name -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
            echo "   📋 Tabelas encontradas: $table_count"
            
            # Verificar migrações Flyway se existir tabela
            if psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db_name -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='flyway_schema_history'" | grep -q 1; then
                local migration_count=$(psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db_name -tAc "SELECT COUNT(*) FROM flyway_schema_history;")
                echo "   🚀 Migrações Flyway: $migration_count"
            fi
        else
            echo "   ❌ Erro na conexão com $db_name"
        fi
    else
        echo "   ❌ Banco $db_name não existe"
    fi
    echo ""
}

# Verificar conexão básica
echo "🔌 Testando conexão com PostgreSQL..."
if pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; then
    echo "   ✅ PostgreSQL está acessível"
else
    echo "   ❌ PostgreSQL não está acessível"
    echo "   Verifique se o PostgreSQL está rodando e as credenciais estão corretas"
    exit 1
fi
echo ""

# Verificar cada banco
echo "📋 Verificando bancos de dados..."
for db in "${EXPECTED_DATABASES[@]}"; do
    check_database $db
done

# Resumo final
echo "=========================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "=========================================="

# Contar bancos existentes
existing_count=0
for db in "${EXPECTED_DATABASES[@]}"; do
    if psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1; then
        ((existing_count++))
    fi
done

echo "Bancos esperados: ${#EXPECTED_DATABASES[@]}"
echo "Bancos encontrados: $existing_count"

if [ $existing_count -eq ${#EXPECTED_DATABASES[@]} ]; then
    echo "✅ Todos os bancos foram criados com sucesso!"
else
    echo "⚠️ Alguns bancos podem estar faltando"
    echo ""
    echo "Para criar os bancos faltantes, execute:"
    echo "  ./scripts/create-databases.sh"
fi

echo ""
echo "🔗 Para conectar via DBeaver:"
echo "  Host: $POSTGRES_HOST"
echo "  Porta: $POSTGRES_PORT"
echo "  Username: $POSTGRES_USER"
echo "  Password: $POSTGRES_PASSWORD"
