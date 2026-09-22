#!/bin/bash

# ===================== SCRIPT DE SETUP COMPLETO DO BANCO =====================
# Este script configura completamente o ambiente de banco de dados

set -e  # Parar em caso de erro

echo "🚀 Configurando ambiente de banco de dados FluxBus..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se PostgreSQL está instalado
check_postgresql() {
    print_status "Verificando instalação do PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL encontrado"
        psql --version
    else
        print_error "PostgreSQL não encontrado. Instale primeiro:"
        echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        echo "  CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
        echo "  macOS: brew install postgresql"
        exit 1
    fi
}

# Verificar se PostgreSQL está rodando
check_postgresql_running() {
    print_status "Verificando se PostgreSQL está rodando..."
    
    if pg_isready -q; then
        print_success "PostgreSQL está rodando"
    else
        print_error "PostgreSQL não está rodando. Inicie o serviço:"
        echo "  sudo systemctl start postgresql"
        echo "  ou"
        echo "  brew services start postgresql"
        exit 1
    fi
}

# Gerar senhas seguras
generate_passwords() {
    print_status "Gerando senhas seguras..."
    
    # Criar arquivo temporário com senhas
    cat > /tmp/fluxbus_passwords.txt << EOF
# Senhas geradas em $(date)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
JWT_SECRET=$(openssl rand -hex 64)

# Instruções:
# 1. Copie as senhas acima
# 2. Cole nos arquivos .env correspondentes
# 3. NUNCA commite estas senhas no Git
# 4. Salve em um gerenciador de senhas
EOF

    print_success "Senhas geradas em /tmp/fluxbus_passwords.txt"
    echo ""
    cat /tmp/fluxbus_passwords.txt
    echo ""
    print_warning "IMPORTANTE: Salve estas senhas em local seguro!"
}

# Criar bancos de dados
create_databases() {
    print_status "Criando bancos de dados..."
    
    # Lista de bancos
    DATABASES=(
        "fluxbus_dev"
        "fluxbus_test" 
        "fluxbus_staging"
        "fluxbus_prod"
        "fluxbus_ci"
    )
    
    for db in "${DATABASES[@]}"; do
        print_status "Criando banco: $db"
        
        if psql -lqt | cut -d \| -f 1 | grep -qw $db; then
            print_warning "Banco $db já existe"
        else
            createdb $db
            print_success "Banco $db criado"
        fi
    done
}

# Criar usuário específico
create_user() {
    print_status "Criando usuário postgressg..."
    
    # Ler senha do arquivo temporário
    POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD=" /tmp/fluxbus_passwords.txt | cut -d'=' -f2)
    
    # Verificar se usuário já existe
    if psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='postgressg'" | grep -q 1; then
        print_warning "Usuário postgressg já existe"
        psql -c "ALTER USER postgressg PASSWORD '$POSTGRES_PASSWORD';"
        print_success "Senha do usuário postgressg atualizada"
    else
        psql -c "CREATE USER postgressg WITH PASSWORD '$POSTGRES_PASSWORD';"
        print_success "Usuário postgressg criado"
    fi
}

# Dar permissões
grant_permissions() {
    print_status "Configurando permissões..."
    
    DATABASES=(
        "fluxbus_dev"
        "fluxbus_test" 
        "fluxbus_staging"
        "fluxbus_prod"
        "fluxbus_ci"
    )
    
    for db in "${DATABASES[@]}"; do
        print_status "Configurando permissões para $db"
        
        psql -d $db -c "
            GRANT ALL PRIVILEGES ON DATABASE $db TO postgressg;
            GRANT ALL PRIVILEGES ON SCHEMA public TO postgressg;
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgressg;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgressg;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgressg;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgressg;
        "
        
        print_success "Permissões configuradas para $db"
    done
}

# Criar arquivos .env
create_env_files() {
    print_status "Criando arquivos de configuração..."
    
    # Ler senhas
    POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD=" /tmp/fluxbus_passwords.txt | cut -d'=' -f2)
    REDIS_PASSWORD=$(grep "REDIS_PASSWORD=" /tmp/fluxbus_passwords.txt | cut -d'=' -f2)
    JWT_SECRET=$(grep "JWT_SECRET=" /tmp/fluxbus_passwords.txt | cut -d'=' -f2)
    
    # Criar .env.dev
    cat > config/environments/.env.dev << EOF
# ===================== CONFIGURAÇÃO DE DESENVOLVIMENTO =====================
ENVIRONMENT=development
SPRING_PROFILES_ACTIVE=dev

# ===================== BANCO DE DADOS =====================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fluxbus_dev
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# ===================== REDIS CACHE =====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# ===================== JWT CONFIGURATION =====================
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=604800000
JWT_REFRESH_EXPIRATION=604800000

# ===================== EMAIL CONFIGURATION =====================
MAIL_HOST=localhost
MAIL_PORT=25
MAIL_USERNAME=dev@localhost
MAIL_PASSWORD=dev
MAIL_FROM=dev@fluxbus.local

# ===================== SERVER CONFIGURATION =====================
SERVER_PORT=8081
SERVER_ADDRESS=0.0.0.0

# ===================== LOGGING CONFIGURATION =====================
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=DEBUG

# ===================== FLYWAY CONFIGURATION =====================
FLYWAY_ENABLED=true
FLYWAY_CLEAN_DISABLED=false
FLYWAY_OUT_OF_ORDER=true
FLYWAY_VALIDATE_ON_MIGRATE=false

# ===================== DEVELOPMENT SPECIFIC =====================
DEV_SHOW_SQL=true
DEV_FORMAT_SQL=true
DEV_HIBERNATE_DDL_AUTO=update

# ===================== SECURITY CONFIGURATION =====================
SECURITY_ENABLED=true
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:8081
EOF

    print_success "Arquivo .env.dev criado"
    
    # Criar .env.prod (sem senhas reais)
    cat > config/environments/.env.prod << EOF
# ===================== CONFIGURAÇÃO DE PRODUÇÃO =====================
ENVIRONMENT=production
SPRING_PROFILES_ACTIVE=prod

# ===================== BANCO DE DADOS =====================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fluxbus_prod
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=CHANGE_THIS_PRODUCTION_PASSWORD

# ===================== REDIS CACHE =====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_PRODUCTION_REDIS_PASSWORD

# ===================== JWT CONFIGURATION =====================
JWT_SECRET=CHANGE_THIS_PRODUCTION_JWT_SECRET_TO_AT_LEAST_256_BITS
JWT_EXPIRATION=604800000
JWT_REFRESH_EXPIRATION=604800000

# ===================== EMAIL CONFIGURATION =====================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=CHANGE_THIS_EMAIL
MAIL_PASSWORD=CHANGE_THIS_EMAIL_PASSWORD
MAIL_FROM=securedguard@z7design.com.br

# ===================== SERVER CONFIGURATION =====================
SERVER_PORT=8081
SERVER_ADDRESS=0.0.0.0

# ===================== LOGGING CONFIGURATION =====================
LOG_LEVEL_ROOT=WARN
LOG_LEVEL_APP=INFO

# ===================== FLYWAY CONFIGURATION =====================
FLYWAY_ENABLED=true
FLYWAY_CLEAN_DISABLED=true
FLYWAY_OUT_OF_ORDER=false
FLYWAY_VALIDATE_ON_MIGRATE=true

# ===================== PRODUCTION SPECIFIC =====================
PROD_SHOW_SQL=false
PROD_FORMAT_SQL=false
PROD_HIBERNATE_DDL_AUTO=validate

# ===================== SECURITY CONFIGURATION =====================
SECURITY_ENABLED=true
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EOF

    print_success "Arquivo .env.prod criado"
}

# Testar conexões
test_connections() {
    print_status "Testando conexões com banco de dados..."
    
    # Testar conexão com usuário postgressg
    if psql -h localhost -p 5432 -U postgressg -d fluxbus_dev -c "SELECT 1;" &> /dev/null; then
        print_success "Conexão com fluxbus_dev funcionando"
    else
        print_error "Erro na conexão com fluxbus_dev"
        return 1
    fi
    
    # Testar outros bancos
    for db in fluxbus_test fluxbus_staging fluxbus_prod fluxbus_ci; do
        if psql -h localhost -p 5432 -U postgressg -d $db -c "SELECT 1;" &> /dev/null; then
            print_success "Conexão com $db funcionando"
        else
            print_error "Erro na conexão com $db"
        fi
    done
}

# Mostrar resumo
show_summary() {
    echo ""
    echo "=========================================="
    echo "🎉 SETUP CONCLUÍDO COM SUCESSO!"
    echo "=========================================="
    echo ""
    echo "📋 Resumo da configuração:"
    echo "  ✅ PostgreSQL configurado e rodando"
    echo "  ✅ 5 bancos de dados criados"
    echo "  ✅ Usuário postgressg criado"
    echo "  ✅ Permissões configuradas"
    echo "  ✅ Arquivos .env criados"
    echo "  ✅ Conexões testadas"
    echo ""
    echo "📁 Arquivos criados:"
    echo "  📄 config/environments/.env.dev"
    echo "  📄 config/environments/.env.prod"
    echo "  📄 /tmp/fluxbus_passwords.txt"
    echo ""
    echo "🔐 Próximos passos:"
    echo "  1. Salve as senhas em um gerenciador de senhas"
    echo "  2. Execute as migrações do Flyway"
    echo "  3. Teste a aplicação"
    echo "  4. Configure o DBeaver com as credenciais"
    echo ""
    echo "📖 Documentação:"
    echo "  📚 config/database/CONEXAO_BANCO_DADOS.md"
    echo "  🔐 config/database/SEGURANCA_SENHAS.md"
    echo ""
    print_warning "IMPORTANTE: Nunca commite arquivos .env com senhas reais!"
    echo ""
}

# Função principal
main() {
    echo "🚀 Iniciando setup do banco de dados FluxBus..."
    echo ""
    
    check_postgresql
    check_postgresql_running
    generate_passwords
    create_databases
    create_user
    grant_permissions
    create_env_files
    test_connections
    show_summary
    
    # Limpar arquivo temporário
    print_status "Limpando arquivos temporários..."
    rm -f /tmp/fluxbus_passwords.txt
    print_success "Setup concluído!"
}

# Executar função principal
main "$@"
