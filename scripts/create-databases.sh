#!/bin/bash

# ===================== SCRIPT PARA CRIAR BANCOS DE DADOS =====================
# Este script cria todos os bancos necessários para o projeto

set -e  # Parar em caso de erro

echo "🗄️ Criando bancos de dados para o projeto SecuredGuard..."
echo ""

# Configurações
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}

# Lista de bancos para criar
DATABASES=(
    "secured_guard_dev"
    "secured_guard_test" 
    "secured_guard_staging"
    "secured_guard_prod"
    "secured_guard_ci"
)

# Função para criar banco
create_database() {
    local db_name=$1
    echo "📊 Criando banco: $db_name"
    
    # Verificar se o banco já existe
    if psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -lqt | cut -d \| -f 1 | grep -qw $db_name; then
        echo "   ✅ Banco $db_name já existe"
    else
        # Criar o banco
        createdb -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER $db_name
        echo "   ✅ Banco $db_name criado com sucesso"
    fi
}

# Função para criar usuário específico
create_user() {
    local username=$1
    local password=$2
    
    echo "👤 Criando usuário: $username"
    
    # Verificar se o usuário já existe
    if psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -tAc "SELECT 1 FROM pg_roles WHERE rolname='$username'" | grep -q 1; then
        echo "   ✅ Usuário $username já existe"
        # Atualizar senha se necessário
        if [ ! -z "$password" ]; then
            psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -c "ALTER USER $username PASSWORD '$password';"
            echo "   🔑 Senha do usuário $username atualizada"
        fi
    else
        # Criar o usuário
        if [ ! -z "$password" ]; then
            psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -c "CREATE USER $username WITH PASSWORD '$password';"
        else
            psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -c "CREATE USER $username;"
        fi
        echo "   ✅ Usuário $username criado com sucesso"
    fi
}

# Função para dar permissões
grant_permissions() {
    local username=$1
    local db_name=$2
    
    echo "🔐 Concedendo permissões para $username no banco $db_name"
    
    # Dar todas as permissões no banco
    psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db_name -c "
        GRANT ALL PRIVILEGES ON DATABASE $db_name TO $username;
        GRANT ALL PRIVILEGES ON SCHEMA public TO $username;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $username;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $username;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $username;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $username;
    "
    
    echo "   ✅ Permissões concedidas com sucesso"
}

# Verificar se PostgreSQL está rodando
echo "🔍 Verificando conexão com PostgreSQL..."
if ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; then
    echo "❌ Erro: PostgreSQL não está acessível em $POSTGRES_HOST:$POSTGRES_PORT"
    echo "   Verifique se o PostgreSQL está rodando e as credenciais estão corretas"
    exit 1
fi
echo "   ✅ PostgreSQL está acessível"
echo ""

# Carregar variáveis de ambiente se disponível
if [ -f ".env" ]; then
    echo "📄 Carregando variáveis de ambiente do arquivo .env..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Criar usuário específico do projeto
create_user "postgressg" "$POSTGRES_PASSWORD"
echo ""

# Criar todos os bancos
echo "🏗️ Criando bancos de dados..."
for db in "${DATABASES[@]}"; do
    create_database $db
done
echo ""

# Dar permissões para o usuário em todos os bancos
echo "🔐 Configurando permissões..."
for db in "${DATABASES[@]}"; do
    grant_permissions "postgressg" $db
done
echo ""

# Listar bancos criados
echo "📋 Bancos de dados disponíveis:"
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -l | grep secured_guard
echo ""

echo "✅ Todos os bancos de dados foram criados e configurados com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis de ambiente nos arquivos .env"
echo "2. Execute o Flyway para aplicar as migrações"
echo "3. Teste as conexões com cada ambiente"
