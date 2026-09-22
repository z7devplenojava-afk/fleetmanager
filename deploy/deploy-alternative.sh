#!/bin/bash

# ========================================
# DEPLOY ALTERNATIVO VPS
# Script que funciona mesmo com problemas de SSH
# ========================================

set -e

echo "🚀 DEPLOY ALTERNATIVO VPS"
echo "========================"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
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

# Verificar se estamos na VPS
if [ -f "/opt/fluxbus/deploy.sh" ]; then
    log "Executando deploy local na VPS..."
    
    cd /opt/fluxbus
    
    log "1. Atualizando código do repositório..."
    git pull origin main || warning "Git pull falhou, continuando com código atual"
    
    log "2. Verificando arquivo .env..."
    if [ ! -f ".env" ]; then
        warning "Arquivo .env não encontrado. Criando..."
        cat > .env << EOF
POSTGRES_DB=fluxbus_prod
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx
POSTGRES_DB_DEV=fluxbus_dev
POSTGRES_USER_DEV=postgressg
POSTGRES_PASSWORD_DEV=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx
POSTGRES_DB_CI=fluxbus_ci
POSTGRES_USER_CI=postgressg
POSTGRES_PASSWORD_CI=S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx
REDIS_PASSWORD=redis_fluxbus_2024
JWT_SECRET=795927eaf0f77f4687edf8c7faaf30e2bd60d1c2215c0015ce9ddc83c8119615a3dec0755b6109a88d5077e6e4344a5b00be395e4c02a57ed923f95f1afebfed
EOF
        chmod 600 .env
    fi
    
    log "3. Parando containers existentes..."
    docker compose -f deploy/docker-compose.prod.yml down 2>/dev/null || true
    docker compose -f deploy/docker-compose.dev.yml down 2>/dev/null || true
    docker compose -f deploy/docker-compose.ci.yml down 2>/dev/null || true
    
    log "4. Limpando containers órfãos..."
    docker system prune -f
    
    log "5. Subindo Postgres primeiro..."
    docker compose -f deploy/docker-compose.prod.yml up -d postgres
    sleep 10
    
    log "6. Verificando Postgres..."
    docker compose -f deploy/docker-compose.prod.yml ps postgres
    
    log "7. Criando banco se necessário..."
    docker compose -f deploy/docker-compose.prod.yml exec postgres sh -c "
        psql -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname='fluxbus_prod'\" | grep -q 1 || \
        psql -U postgres -c \"CREATE DATABASE fluxbus_prod OWNER postgressg;\"
    " || warning "Erro ao criar banco, continuando..."
    
    log "8. Configurando usuário Postgres..."
    docker compose -f deploy/docker-compose.prod.yml exec postgres sh -c "
        psql -U postgres -tc \"SELECT 1 FROM pg_roles WHERE rolname='postgressg'\" | grep -q 1 || \
        psql -U postgres -c \"CREATE USER postgressg WITH SUPERUSER PASSWORD 'S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx';\"
    " || warning "Erro ao criar usuário, continuando..."
    
    log "9. Reparando Flyway..."
    docker run --rm \
        --network fluxbus-network \
        -v /opt/fluxbus/backend/src/main/resources/db/migration:/flyway/sql \
        flyway/flyway:9.22.3 \
        -url=jdbc:postgresql://postgres:5432/fluxbus_prod \
        -user=postgressg \
        -password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
        -schemas=public \
        repair || warning "Flyway repair falhou, continuando..."
    
    log "10. Migrando Flyway..."
    docker run --rm \
        --network fluxbus-network \
        -v /opt/fluxbus/backend/src/main/resources/db/migration:/flyway/sql \
        flyway/flyway:9.22.3 \
        -url=jdbc:postgresql://postgres:5432/fluxbus_prod \
        -user=postgressg \
        -password='S7UGKd%bnKW0!lhBA#BRJLCd!IpXvsnx' \
        -schemas=public \
        -outOfOrder=true \
        migrate || warning "Flyway migrate falhou, continuando..."
    
    log "11. Subindo Redis..."
    docker compose -f deploy/docker-compose.prod.yml up -d redis
    sleep 5
    
    log "12. Subindo Backend..."
    docker compose -f deploy/docker-compose.prod.yml up -d backend
    sleep 20
    
    log "13. Verificando logs do backend..."
    docker compose -f deploy/docker-compose.prod.yml logs --tail=30 backend
    
    log "14. Subindo Frontend..."
    docker compose -f deploy/docker-compose.prod.yml up -d frontend
    sleep 10
    
    log "15. Subindo Nginx..."
    docker compose -f deploy/docker-compose.prod.yml up -d nginx
    sleep 5
    
    log "16. Status final dos serviços..."
    docker compose -f deploy/docker-compose.prod.yml ps
    
    log "17. Testando health checks..."
    sleep 10
    
    # Teste backend
    if curl -f http://localhost:8080/actuator/health 2>/dev/null; then
        echo "✅ Backend funcionando!"
    else
        echo "❌ Backend com problemas"
        echo "Logs do backend:"
        docker compose -f deploy/docker-compose.prod.yml logs --tail=20 backend
    fi
    
    # Teste frontend
    if curl -f http://localhost/ 2>/dev/null; then
        echo "✅ Frontend funcionando!"
    else
        echo "❌ Frontend com problemas"
    fi
    
    log "18. Configurando auto-start..."
    # Criar serviço systemd se não existir
    if [ ! -f "/etc/systemd/system/fluxbus.service" ]; then
        cat > /etc/systemd/system/fluxbus.service << EOF
[Unit]
Description=FluxBus Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/fluxbus
ExecStart=/opt/fluxbus/deploy.sh
ExecStop=/usr/bin/docker compose -f /opt/fluxbus/deploy/docker-compose.prod.yml down
TimeoutStartSec=300
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable fluxbus.service
        log "Serviço systemd configurado"
    fi
    
    echo ""
    log "DEPLOY CONCLUÍDO!"
    echo "================"
    echo ""
    info "URLs:"
    echo "  Frontend: http://localhost/"
    echo "  Backend:  http://localhost:8080"
    echo "  Health:   http://localhost:8080/actuator/health"
    echo ""
    info "Comandos úteis:"
    echo "  docker compose -f deploy/docker-compose.prod.yml logs -f backend"
    echo "  docker compose -f deploy/docker-compose.prod.yml ps"
    echo "  docker compose -f deploy/docker-compose.prod.yml restart backend"
    echo "  systemctl status fluxbus"
    
else
    log "Executando deploy remoto..."
    
    # Verificar variáveis
    if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_PORT" ]; then
        error "Variáveis VPS_HOST, VPS_USER ou VPS_PORT não definidas"
        exit 1
    fi
    
    log "1. Instalando dependências..."
    sudo apt-get update
    sudo apt-get install -y sshpass rsync
    
    log "2. Configurando SSH..."
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    touch ~/.ssh/known_hosts
    chmod 600 ~/.ssh/known_hosts
    
    # Adicionar host conhecido
    ssh-keyscan -p $VPS_PORT $VPS_HOST >> ~/.ssh/known_hosts
    
    log "3. Testando conectividade..."
    if ! sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo 'SSH OK'"; then
        error "Não foi possível conectar à VPS"
        exit 1
    fi
    
    log "4. Copiando código..."
    sshpass -p "$VPS_PASSWORD" rsync -avz --delete \
        --exclude='.git/' \
        --exclude='node_modules/' \
        --exclude='target/' \
        --exclude='*.log' \
        --exclude='uploads/' \
        --exclude='logs/' \
        --exclude='backups/' \
        -e "ssh -p $VPS_PORT -o StrictHostKeyChecking=no" \
        ./ $VPS_USER@$VPS_HOST:/opt/fluxbus/
    
    log "5. Executando deploy na VPS..."
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
        cd /opt/fluxbus
        chmod +x deploy/fix-backend.sh
        ./deploy/fix-backend.sh
    "
    
    log "6. Verificando status..."
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
        cd /opt/fluxbus
        docker compose -f deploy/docker-compose.prod.yml ps
    "
    
    log "✅ Deploy remoto concluído!"
fi

echo ""
echo "========================"
log "DEPLOY ALTERNATIVO CONCLUÍDO"
echo "========================"
