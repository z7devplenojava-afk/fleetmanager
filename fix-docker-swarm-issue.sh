#!/bin/bash

# Script para corrigir problemas com Docker Swarm e containers CI
# Executar no VPS: bash fix-docker-swarm-issue.sh

set -e

echo "🔧 =========================================="
echo "🔧 CORREÇÃO DE PROBLEMAS DOCKER SWARM"
echo "🔧 ========================================="
echo ""

cd /var/www/fluxbus/ci

# 1. Verificar se está em modo swarm
echo "📋 Verificando modo Docker..."
if docker info | grep -q "Swarm: active"; then
    echo "⚠️ Docker está em modo Swarm"
    echo "🔄 Saindo do modo Swarm (se possível)..."
    docker swarm leave --force 2>/dev/null || echo "⚠️ Não foi possível sair do modo Swarm (pode estar em uso por outros serviços)"
else
    echo "✅ Docker não está em modo Swarm"
fi

# 2. Parar e remover todos os containers CI
echo ""
echo "🛑 Parando e removendo containers CI..."
docker-compose -f docker-compose.ci.yml down --remove-orphans 2>/dev/null || true

# 3. Remover containers órfãos manualmente (incluindo os com nomes estranhos)
echo ""
echo "🧹 Removendo containers órfãos..."
docker ps -a | grep "fluxbus" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true
docker ps -a --format "{{.ID}} {{.Names}}" | grep -E "(fluxbus|cc[0-9a-f]+_fluxbus)" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# Remover containers específicos com padrões conhecidos
docker ps -a | grep -E "cc[0-9a-f]+_fluxbus" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# 4. Limpar redes órfãs
echo ""
echo "🧹 Limpando redes órfãs..."
docker network prune -f 2>/dev/null || true
docker network rm fluxbus-ci-network 2>/dev/null || true

# 5. Remover imagens corrompidas
echo ""
echo "🧹 Removendo imagens corrompidas..."
docker images | grep "z7design/fluxbus" | grep -E "(<none>|ci)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# 6. Verificar se as imagens existem
echo ""
echo "🔍 Verificando imagens Docker..."
IMAGES=(
    "z7design/fluxbus-backend:ci"
    "z7design/fluxbus-frontend:ci"
    "z7design/fluxbus-whatsapp:ci"
)

MISSING_IMAGES=()
for IMAGE in "${IMAGES[@]}"; do
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${IMAGE}$"; then
        echo "✅ Imagem encontrada: $IMAGE"
    else
        echo "❌ Imagem não encontrada: $IMAGE"
        MISSING_IMAGES+=("$IMAGE")
    fi
done

# 7. Fazer pull das imagens faltantes
if [ ${#MISSING_IMAGES[@]} -gt 0 ]; then
    echo ""
    echo "📥 Fazendo pull das imagens faltantes..."
    for IMAGE in "${MISSING_IMAGES[@]}"; do
        echo "📥 Baixando: $IMAGE"
        docker pull "$IMAGE" || echo "⚠️ Erro ao baixar $IMAGE"
    done
fi

# 8. Limpar volumes órfãos (cuidado!)
echo ""
echo "🧹 Limpando volumes órfãos..."
docker volume prune -f 2>/dev/null || true

# 9. Verificar arquivo .env
echo ""
echo "🔍 Verificando arquivo .env..."
if [ -f .env ]; then
    echo "✅ Arquivo .env existe"
    if grep -q "^JWT_SECRET=" .env; then
        JWT_LENGTH=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2 | wc -c)
        echo "📏 Tamanho do JWT_SECRET: $((JWT_LENGTH - 1)) caracteres"
        if [ $JWT_LENGTH -lt 65 ]; then
            echo "⚠️ JWT_SECRET é muito curto! Corrija manualmente."
        fi
    else
        echo "⚠️ JWT_SECRET não encontrado no .env"
    fi
else
    echo "❌ Arquivo .env não existe!"
fi

# 10. Verificar se nginx.conf existe
echo ""
echo "🔍 Verificando nginx.conf..."
if [ ! -f "nginx/ci.conf" ]; then
    echo "❌ ERRO: nginx/ci.conf não encontrado!"
    exit 1
else
    echo "✅ nginx/ci.conf encontrado"
fi

# 11. Tentar iniciar containers com docker compose (v2) se disponível
echo ""
echo "🚀 Tentando iniciar containers..."
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "✅ Usando 'docker compose' (v2)..."
    docker compose -f docker-compose.ci.yml up -d --force-recreate --remove-orphans
elif command -v docker-compose &> /dev/null; then
    echo "✅ Usando 'docker-compose' (v1)..."
    COMPOSE_HTTP_TIMEOUT=300 docker-compose -f docker-compose.ci.yml up -d --force-recreate --remove-orphans
else
    echo "❌ Docker Compose não encontrado!"
    exit 1
fi

# 12. Aguardar containers iniciarem
echo ""
echo "⏳ Aguardando containers iniciarem (30s)..."
sleep 30

# 13. Verificar status dos containers
echo ""
echo "📋 Status dos containers:"
docker-compose -f docker-compose.ci.yml ps || docker compose -f docker-compose.ci.yml ps

# 14. Verificar logs do backend
echo ""
echo "📋 Logs do backend (últimas 20 linhas):"
docker logs --tail 20 fluxbus-backend-ci 2>&1 || echo "⚠️ Container backend não encontrado"

# 15. Verificar logs do nginx
echo ""
echo "📋 Logs do nginx (últimas 20 linhas):"
docker logs --tail 20 fluxbus-nginx-ci 2>&1 || echo "⚠️ Container nginx não encontrado"

echo ""
echo "✅ =========================================="
echo "✅ CORREÇÃO CONCLUÍDA"
echo "✅ =========================================="

