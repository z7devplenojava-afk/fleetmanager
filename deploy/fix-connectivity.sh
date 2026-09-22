#!/bin/bash

# ========================================
# CORREÇÃO CONECTIVIDADE SSH VPS
# Script para corrigir problemas de SSH na VPS
# ========================================

set -e

echo "🔧 CORREÇÃO CONECTIVIDADE SSH VPS"
echo "================================="

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
    log "Executando correções na VPS..."
    
    log "1. Atualizando sistema..."
    apt-get update -y
    
    log "2. Instalando dependências SSH..."
    apt-get install -y openssh-server openssh-client
    
    log "3. Configurando SSH daemon..."
    cat > /etc/ssh/sshd_config << EOF
# Configuração SSH otimizada
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Configurações de segurança
LoginGraceTime 120
PermitRootLogin yes
StrictModes yes
RSAAuthentication yes
PubkeyAuthentication yes
PasswordAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no

# Configurações de sessão
X11Forwarding yes
X11DisplayOffset 10
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes
ClientAliveInterval 60
ClientAliveCountMax 3

# Configurações de log
SyslogFacility AUTH
LogLevel INFO

# Configurações de usuário
AllowUsers root
MaxAuthTries 3
MaxSessions 10

# Configurações de rede
UseDNS no
EOF
    
    log "4. Configurando firewall..."
    ufw --force enable
    ufw allow ssh
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8080/tcp
    ufw allow 8081/tcp
    ufw allow 8082/tcp
    
    log "5. Configurando chaves SSH..."
    mkdir -p /root/.ssh
    chmod 700 /root/.ssh
    
    # Gerar chave SSH se não existir
    if [ ! -f /root/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -f /root/.ssh/id_rsa -N ""
    fi
    
    # Adicionar chave pública ao authorized_keys
    cat /root/.ssh/id_rsa.pub >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    
    log "6. Configurando Fail2Ban..."
    apt-get install -y fail2ban
    
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF
    
    log "7. Reiniciando serviços..."
    systemctl restart ssh
    systemctl enable ssh
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log "8. Verificando status SSH..."
    systemctl status ssh --no-pager
    
    log "9. Testando conectividade SSH local..."
    ssh -o StrictHostKeyChecking=no root@localhost "echo 'SSH local OK'"
    
    log "10. Verificando portas..."
    netstat -tlnp | grep :22
    
    log "11. Verificando logs SSH..."
    tail -5 /var/log/auth.log
    
    log "12. Configurando projeto FluxBus..."
    cd /opt/fluxbus
    
    # Garantir que arquivo .env existe
    if [ ! -f ".env" ]; then
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
    
    log "13. Subindo serviços FluxBus..."
    docker compose -f deploy/docker-compose.prod.yml down 2>/dev/null || true
    docker compose -f deploy/docker-compose.prod.yml up -d
    sleep 30
    
    log "14. Verificando status dos serviços..."
    docker compose -f deploy/docker-compose.prod.yml ps
    
    log "15. Testando health check..."
    curl -f http://localhost:8080/actuator/health 2>/dev/null && echo "✅ Backend OK" || echo "❌ Backend com problemas"
    
    echo ""
    log "INFORMAÇÕES PARA CONEXÃO SSH:"
    echo "============================"
    echo "Host: $(hostname -I | awk '{print $1}')"
    echo "Port: 22"
    echo "User: root"
    echo "Chave pública:"
    cat /root/.ssh/id_rsa.pub
    
else
    log "Executando correções locais..."
    
    log "1. Instalando sshpass..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v brew &> /dev/null; then
        brew install sshpass
    else
        warning "Não foi possível instalar sshpass automaticamente"
    fi
    
    log "2. Configurando SSH local..."
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    log "3. Testando conectividade..."
    if [ -n "$VPS_HOST" ] && [ -n "$VPS_USER" ] && [ -n "$VPS_PORT" ]; then
        log "Testando conexão com $VPS_USER@$VPS_HOST:$VPS_PORT"
        
        # Teste básico
        ping -c 3 $VPS_HOST || error "Ping falhou"
        
        # Teste de porta
        nc -zv $VPS_HOST $VPS_PORT || error "Porta SSH inacessível"
        
        # Teste SSH
        ssh -p $VPS_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo 'SSH OK'" || error "SSH falhou"
        
        log "✅ Conectividade SSH OK!"
    else
        error "Variáveis VPS não definidas"
    fi
fi

echo ""
echo "================================="
log "CORREÇÃO CONCLUÍDA"
echo "================================="
