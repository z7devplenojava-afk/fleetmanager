#!/bin/bash
set -e

# ===================== SCRIPT DE INICIALIZAÇÃO DOS BANCOS =====================
# Este script é executado automaticamente quando o container PostgreSQL é criado
# Ele cria todos os bancos necessários para o projeto

echo "🗄️ Inicializando bancos de dados SecuredGuard..."

# Lista de bancos para criar (além do banco padrão)
DATABASES=(
    "secured_guard_dev"
    "secured_guard_test"
    "secured_guard_staging" 
    "secured_guard_ci"
)

# Função para criar banco se não existir
create_database_if_not_exists() {
    local db_name=$1
    echo "📊 Verificando banco: $db_name"
    
    # Verificar se o banco já existe
    if psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -lqt | cut -d \| -f 1 | grep -qw $db_name; then
        echo "   ✅ Banco $db_name já existe"
    else
        # Criar o banco
        echo "   🏗️ Criando banco $db_name"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            CREATE DATABASE $db_name;
EOSQL
        echo "   ✅ Banco $db_name criado com sucesso"
    fi
}

# Criar todos os bancos adicionais
echo "🏗️ Criando bancos de dados adicionais..."
for db in "${DATABASES[@]}"; do
    create_database_if_not_exists $db
done

echo ""
echo "✅ Inicialização dos bancos de dados concluída!"
echo "📋 Bancos disponíveis:"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "\l" | grep secured_guard

echo ""
echo "🚀 Pronto para receber conexões!"
