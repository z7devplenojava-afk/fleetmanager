#!/bin/bash

# Script de instalação limpa da VPS para FluxBus CI
# Execute: bash instalar-vps-limpa.sh

set -e

echo "🚀 =========================================="
echo "🚀 INSTALAÇÃO LIMPA DA VPS - FLUXBUS CI"
echo "🚀 ========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor, execute como root ou com sudo"
    exit 1
fi

# ============================================
# 1. ATUALIZAR SISTEMA
# ============================================
echo "1️⃣ Atualizando sistema..."
apt update && apt upgrade -y
apt install -y curl wget git vim nano htop ufw

# ============================================
# 2. INSTALAR DOCKER
# ============================================
echo ""
echo "2️⃣ Instalando Docker..."

# Remover versões antigas
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Instalar dependências
apt install -y ca-certificates gnupg lsb-release

# Adicionar chave GPG
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
echo ""
echo "✅ Docker instalado:"
docker --version
docker compose version

# ============================================
# 3. CONFIGURAR FIREWALL
# ============================================
echo ""
echo "3️⃣ Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8081/tcp
ufw allow 8082/tcp
ufw allow 3333/tcp
ufw --force enable
echo "✅ Firewall configurado"

# ============================================
# 4. CRIAR ESTRUTURA DE DIRETÓRIOS
# ============================================
echo ""
echo "4️⃣ Criando estrutura de diretórios..."
mkdir -p /var/www/fluxbus/ci/{postgres_data,redis_data,uploads,logs,whatsapp_sessions,backups}
mkdir -p /root/fluxbus
chmod -R 755 /var/www/fluxbus
chmod -R 755 /root/fluxbus
echo "✅ Diretórios criados"

# ============================================
# 5. CRIAR REDES DOCKER
# ============================================
echo ""
echo "5️⃣ Criando redes Docker..."

# Sair do modo Swarm se estiver ativo
docker swarm leave --force 2>/dev/null || echo "Não estava em modo Swarm"

# Criar redes
docker network create z7network 2>/dev/null || echo "Rede z7network já existe"
docker network create fluxbus-ci-network 2>/dev/null || echo "Rede fluxbus-ci-network já existe"

echo "✅ Redes criadas:"
docker network ls | grep -E "(z7network|fluxbus)"

# ============================================
# 6. CLONAR REPOSITÓRIO
# ============================================
echo ""
echo "6️⃣ Clonando repositório..."

cd /root

# Remover diretório antigo se existir
if [ -d "fluxbus" ]; then
    echo "⚠️ Diretório fluxbus já existe. Removendo..."
    rm -rf fluxbus
fi

# Clonar repositório
git clone https://github.com/zmarioramos/fluxbus.git fluxbus

cd fluxbus

# Mudar para branch ci
git checkout ci

echo "✅ Repositório clonado na branch: $(git branch --show-current)"

# ============================================
# 7. CRIAR ARQUIVO .env
# ============================================
echo ""
echo "7️⃣ Criando arquivo .env..."

cat > /root/fluxbus/.env << 'EOF'
# PostgreSQL
POSTGRES_PASSWORD_CI=4KaCiJc6an@7sgbdcid2025
POSTGRES_DB=fluxbus_ci
POSTGRES_USER=fluxbus_ci

# Redis
REDIS_PASSWORD=redis_ci_2025

# JWT (mínimo 64 bytes para HS512)
JWT_SECRET=jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key

# URLs
API_URL=https://ci.z7botsolutions.com.br/api
FRONTEND_URL=https://ci.z7botsolutions.com.br
EOF

chmod 600 /root/fluxbus/.env
echo "✅ Arquivo .env criado"

# ============================================
# 8. VERIFICAR ARQUIVOS NECESSÁRIOS
# ============================================
echo ""
echo "8️⃣ Verificando arquivos necessários..."

cd /root/fluxbus

if [ ! -f "docker-compose.ci.yml" ]; then
    echo "⚠️ docker-compose.ci.yml não encontrado na raiz. Verificando em ci/..."
    if [ -f "ci/docker-compose.ci.yml" ]; then
        echo "✅ docker-compose.ci.yml encontrado em ci/"
    else
        echo "❌ docker-compose.ci.yml não encontrado!"
    fi
else
    echo "✅ docker-compose.ci.yml encontrado"
fi

if [ ! -f "nginx/ci.conf" ]; then
    echo "⚠️ nginx/ci.conf não encontrado na raiz. Verificando em ci/nginx/..."
    if [ -f "ci/nginx/ci.conf" ]; then
        echo "✅ nginx/ci.conf encontrado em ci/nginx/"
    else
        echo "❌ nginx/ci.conf não encontrado!"
    fi
else
    echo "✅ nginx/ci.conf encontrado"
fi

# ============================================
# 9. RESUMO
# ============================================
echo ""
echo "✅ =========================================="
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo "✅ ========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Fazer deploy via GitHub Actions:"
echo "   - Vá para: https://github.com/zmarioramos/fluxbus/actions"
echo "   - Execute o workflow 'Deploy CI Environment'"
echo ""
echo "2. OU fazer deploy manual:"
echo "   cd /root/fluxbus/ci"
echo "   docker compose -f docker-compose.ci.yml up -d"
echo ""
echo "3. Verificar status:"
echo "   docker compose -f docker-compose.ci.yml ps"
echo ""
echo "4. Ver logs:"
echo "   docker compose -f docker-compose.ci.yml logs -f"
echo ""
echo "📋 Informações:"
echo "   - Diretório do projeto: /root/fluxbus"
echo "   - Diretório de volumes: /var/www/fluxbus/ci"
echo "   - Branch: ci"
echo "   - Arquivo .env: /root/fluxbus/.env"
echo ""

