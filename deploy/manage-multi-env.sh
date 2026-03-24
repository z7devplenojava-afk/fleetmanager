#!/bin/bash

# ========================================
# SCRIPT DE GERENCIAMENTO MULTI-AMBIENTE
# SecuredGuard - VPS Multi-Environment Manager
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/opt/secured-guard"
COMPOSE_FILE="deploy/docker-compose.multi-env.yml"
ENVIRONMENTS=("dev" "prod" "ci")

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Função para verificar se o Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando. Inicie o Docker primeiro."
        exit 1
    fi
}

# Função para reparar Flyway em um ambiente específico
repair_flyway() {
    local env=$1
    local db_port=$2
    local db_name=$3
    
    log "Reparando Flyway para ambiente: $env"
    
    # Parar backend do ambiente específico
    docker compose -f $COMPOSE_FILE stop backend-$env 2>/dev/null || true
    
    # Aguardar um pouco
    sleep 2
    
    # Repair usando container Flyway
    docker run --rm \
        --network secured-guard-network \
        -v $PROJECT_DIR/backend/src/main/resources/db/migration:/flyway/sql \
        flyway/flyway:9.22.3 \
        -url=jdbc:postgresql://postgres-$env:5432/$db_name \
        -user=postgressg \
        -password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
        -schemas=public \
        repair
    
    log "Flyway repair concluído para $env"
}

# Função para migrar Flyway em um ambiente específico
migrate_flyway() {
    local env=$1
    local db_port=$2
    local db_name=$3
    
    log "Migrando Flyway para ambiente: $env"
    
    # Migrate usando container Flyway
    docker run --rm \
        --network secured-guard-network \
        -v $PROJECT_DIR/backend/src/main/resources/db/migration:/flyway/sql \
        flyway/flyway:9.22.3 \
        -url=jdbc:postgresql://postgres-$env:5432/$db_name \
        -user=postgressg \
        -password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
        -schemas=public \
        -outOfOrder=true \
        migrate
    
    log "Flyway migrate concluído para $env"
}

# Função para verificar status do Flyway
check_flyway() {
    local env=$1
    local db_port=$2
    local db_name=$3
    
    log "Verificando status do Flyway para ambiente: $env"
    
    docker run --rm \
        --network secured-guard-network \
        -v $PROJECT_DIR/backend/src/main/resources/db/migration:/flyway/sql \
        flyway/flyway:9.22.3 \
        -url=jdbc:postgresql://postgres-$env:5432/$db_name \
        -user=postgressg \
        -password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
        -schemas=public \
        info
}

# Função para iniciar todos os ambientes
start_all() {
    log "Iniciando todos os ambientes..."
    
    cd $PROJECT_DIR
    
    # Subir todos os bancos primeiro
    docker compose -f $COMPOSE_FILE up -d postgres-dev postgres-prod postgres-ci
    
    # Aguardar bancos ficarem healthy
    log "Aguardando bancos ficarem healthy..."
    sleep 10
    
    # Subir Redis
    docker compose -f $COMPOSE_FILE up -d redis-dev redis-prod redis-ci
    
    # Aguardar Redis ficar healthy
    log "Aguardando Redis ficar healthy..."
    sleep 5
    
    # Subir backends
    docker compose -f $COMPOSE_FILE up -d backend-dev backend-prod backend-ci
    
    # Aguardar backends ficarem healthy
    log "Aguardando backends ficarem healthy..."
    sleep 15
    
    # Subir frontends
    docker compose -f $COMPOSE_FILE up -d frontend-dev frontend-prod frontend-ci
    
    # Subir nginx
    docker compose -f $COMPOSE_FILE up -d nginx
    
    log "Todos os ambientes iniciados!"
    show_status
}

# Função para parar todos os ambientes
stop_all() {
    log "Parando todos os ambientes..."
    
    cd $PROJECT_DIR
    docker compose -f $COMPOSE_FILE down
    
    log "Todos os ambientes parados!"
}

# Função para reparar Flyway em todos os ambientes
repair_all_flyway() {
    log "Reparando Flyway em todos os ambientes..."
    
    # Mapeamento de ambientes
    declare -A env_config=(
        ["dev"]="5432 secured_guard_dev"
        ["prod"]="5433 secured_guard_prod"
        ["ci"]="5434 secured_guard_ci"
    )
    
    for env in "${ENVIRONMENTS[@]}"; do
        IFS=' ' read -r db_port db_name <<< "${env_config[$env]}"
        repair_flyway $env $db_port $db_name
    done
    
    log "Flyway repair concluído em todos os ambientes!"
}

# Função para migrar Flyway em todos os ambientes
migrate_all_flyway() {
    log "Migrando Flyway em todos os ambientes..."
    
    # Mapeamento de ambientes
    declare -A env_config=(
        ["dev"]="5432 secured_guard_dev"
        ["prod"]="5433 secured_guard_prod"
        ["ci"]="5434 secured_guard_ci"
    )
    
    for env in "${ENVIRONMENTS[@]}"; do
        IFS=' ' read -r db_port db_name <<< "${env_config[$env]}"
        migrate_flyway $env $db_port $db_name
    done
    
    log "Flyway migrate concluído em todos os ambientes!"
}

# Função para mostrar status
show_status() {
    log "Status dos serviços:"
    echo ""
    
    cd $PROJECT_DIR
    docker compose -f $COMPOSE_FILE ps
    
    echo ""
    log "URLs dos ambientes:"
    echo "  🟢 DESENVOLVIMENTO:"
    echo "    - Frontend: http://localhost:3000"
    echo "    - Backend:  http://localhost:8081"
    echo "    - Database: localhost:5432"
    echo ""
    echo "  🔴 PRODUÇÃO:"
    echo "    - Frontend: http://localhost:80"
    echo "    - Backend:  http://localhost:8080"
    echo "    - Database: localhost:5433"
    echo ""
    echo "  🟡 CI/CD:"
    echo "    - Frontend: http://localhost:3001"
    echo "    - Backend:  http://localhost:8082"
    echo "    - Database: localhost:5434"
    echo ""
}

# Função para mostrar logs de um ambiente específico
show_logs() {
    local env=$1
    local service=$2
    
    if [ -z "$service" ]; then
        service="backend"
    fi
    
    log "Mostrando logs do $service-$env..."
    
    cd $PROJECT_DIR
    docker compose -f $COMPOSE_FILE logs -f $service-$env
}

# Função para reiniciar um ambiente específico
restart_env() {
    local env=$1
    
    log "Reiniciando ambiente: $env"
    
    cd $PROJECT_DIR
    docker compose -f $COMPOSE_FILE restart backend-$env frontend-$env
    
    log "Ambiente $env reiniciado!"
}

# Função para health check
health_check() {
    log "Verificando saúde dos serviços..."
    
    local services=(
        "http://localhost:8081/actuator/health:DEV"
        "http://localhost:8080/actuator/health:PROD"
        "http://localhost:8082/actuator/health:CI"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r url env_name <<< "$service"
        
        if curl -s -f "$url" > /dev/null; then
            log "✅ $env_name Backend: OK"
        else
            error "❌ $env_name Backend: FALHOU"
        fi
    done
}

# Função para backup
backup_all() {
    local backup_dir="/opt/secured-guard/backups/$(date +%Y%m%d_%H%M%S)"
    
    log "Criando backup em: $backup_dir"
    
    mkdir -p "$backup_dir"
    
    # Backup dos bancos
    for env in "${ENVIRONMENTS[@]}"; do
        local db_name="secured_guard_$env"
        log "Fazendo backup do banco: $db_name"
        
        docker exec secured-guard-db-$env pg_dump -U postgressg "$db_name" > "$backup_dir/${db_name}.sql"
    done
    
    # Backup das configurações
    cp -r $PROJECT_DIR/config "$backup_dir/"
    cp $PROJECT_DIR/.env "$backup_dir/" 2>/dev/null || true
    
    log "Backup concluído em: $backup_dir"
}

# Função para mostrar ajuda
show_help() {
    echo "SecuredGuard Multi-Environment Manager"
    echo ""
    echo "Uso: $0 [COMANDO] [ARGUMENTOS]"
    echo ""
    echo "Comandos:"
    echo "  start                    - Inicia todos os ambientes"
    echo "  stop                     - Para todos os ambientes"
    echo "  restart                  - Reinicia todos os ambientes"
    echo "  status                   - Mostra status dos serviços"
    echo "  logs [env] [service]     - Mostra logs (env: dev|prod|ci, service: backend|frontend)"
    echo "  restart-env [env]        - Reinicia ambiente específico"
    echo "  repair-flyway            - Repara Flyway em todos os ambientes"
    echo "  migrate-flyway           - Migra Flyway em todos os ambientes"
    echo "  check-flyway [env]       - Verifica status do Flyway"
    echo "  health                   - Verifica saúde dos serviços"
    echo "  backup                   - Cria backup de todos os bancos"
    echo "  help                     - Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 start"
    echo "  $0 logs prod backend"
    echo "  $0 restart-env dev"
    echo "  $0 repair-flyway"
}

# Função principal
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_all
            ;;
        stop)
            stop_all
            ;;
        restart)
            stop_all
            sleep 5
            start_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2" "$3"
            ;;
        restart-env)
            restart_env "$2"
            ;;
        repair-flyway)
            repair_all_flyway
            ;;
        migrate-flyway)
            migrate_all_flyway
            ;;
        check-flyway)
            if [ -z "$2" ]; then
                error "Especifique o ambiente: dev, prod ou ci"
                exit 1
            fi
            declare -A env_config=(
                ["dev"]="5432 secured_guard_dev"
                ["prod"]="5433 secured_guard_prod"
                ["ci"]="5434 secured_guard_ci"
            )
            IFS=' ' read -r db_port db_name <<< "${env_config[$2]}"
            check_flyway "$2" "$db_port" "$db_name"
            ;;
        health)
            health_check
            ;;
        backup)
            backup_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Comando desconhecido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
