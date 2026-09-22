#!/bin/bash
# Script para resetar senha do PostgreSQL na VPS CI

set -e

echo "🔧 ========================================"
echo "🔧 RESETAR SENHA DO POSTGRESQL - VPS CI"
echo "🔧 ========================================"
echo ""

cd /var/www/fluxbus/ci || {
    echo "❌ Diretório /var/www/fluxbus/ci não encontrado!"
    exit 1
}

# Carregar .env se existir
if [ -f .env ]; then
    source .env
    echo "✅ Arquivo .env carregado"
else
    echo "⚠️ Arquivo .env não encontrado, usando valores padrão"
fi

# Definir senha
POSTGRES_PASSWORD="${POSTGRES_PASSWORD_CI:-4KaCiJc6an@7sgbdcid2025}"
echo "🔐 Senha a ser usada: ${POSTGRES_PASSWORD:0:10}..."
echo ""

# Parar containers
echo "🛑 Parando containers..."
docker-compose -f docker-compose.ci.yml stop backend-ci postgres-ci 2>/dev/null || true
docker-compose -f docker-compose.ci.yml stop postgres-ci 2>/dev/null || true

# Aguardar um pouco
sleep 5

# Remover container do PostgreSQL (mas manter volume se quiser preservar dados)
echo "🗑️ Removendo container do PostgreSQL..."
docker rm -f fluxbus-db-ci 2>/dev/null || true

# Opção 1: Resetar senha sem perder dados (recomendado)
echo ""
echo "📋 Opção 1: Resetar senha sem perder dados"
echo "💡 Isso vai alterar a senha no banco existente"
echo ""

# Iniciar PostgreSQL temporariamente para resetar senha
echo "🚀 Iniciando PostgreSQL temporariamente..."
docker-compose -f docker-compose.ci.yml up -d postgres-ci

echo "⏳ Aguardando PostgreSQL iniciar (20s)..."
sleep 20

# Verificar se está rodando
if ! docker ps | grep -q "fluxbus-db-ci"; then
    echo "❌ PostgreSQL não iniciou!"
    echo "📋 Logs:"
    docker logs fluxbus-db-ci --tail 30 2>&1 || true
    exit 1
fi

# Tentar resetar senha usando ALTER USER
echo "🔐 Tentando resetar senha do usuário..."
docker exec fluxbus-db-ci psql -U fluxbus_ci -d postgres -c "ALTER USER fluxbus_ci WITH PASSWORD '$POSTGRES_PASSWORD';" 2>&1 || {
    echo "⚠️ Não foi possível resetar senha (pode ser que o usuário não exista ou senha antiga esteja errada)"
    echo "💡 Tentando criar usuário novamente..."
    
    # Parar PostgreSQL
    docker-compose -f docker-compose.ci.yml stop postgres-ci
    sleep 5
    
    # Remover volume (isso vai apagar dados!)
    echo "⚠️ ATENÇÃO: Removendo volume do PostgreSQL (dados serão perdidos)"
    read -p "Deseja continuar? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operação cancelada"
        exit 1
    fi
    
    docker volume rm fluxbus_postgres_data_ci 2>/dev/null || true
    echo "✅ Volume removido"
}

# Garantir que .env tem a senha correta
echo ""
echo "📝 Atualizando arquivo .env..."
if [ -f .env ]; then
    if grep -q "^POSTGRES_PASSWORD_CI=" .env; then
        sed -i "s|^POSTGRES_PASSWORD_CI=.*|POSTGRES_PASSWORD_CI=$POSTGRES_PASSWORD|g" .env
        echo "✅ POSTGRES_PASSWORD_CI atualizado no .env"
    else
        echo "POSTGRES_PASSWORD_CI=$POSTGRES_PASSWORD" >> .env
        echo "✅ POSTGRES_PASSWORD_CI adicionado ao .env"
    fi
else
    echo "POSTGRES_PASSWORD_CI=$POSTGRES_PASSWORD" > .env
    echo "✅ Arquivo .env criado"
fi

# Reiniciar PostgreSQL
echo ""
echo "🔄 Reiniciando PostgreSQL..."
docker-compose -f docker-compose.ci.yml up -d postgres-ci

echo "⏳ Aguardando PostgreSQL iniciar (30s)..."
sleep 30

# Verificar se está rodando
if docker ps | grep -q "fluxbus-db-ci"; then
    echo "✅ PostgreSQL está rodando!"
    
    # Testar conexão
    echo "🔍 Testando conexão com nova senha..."
    docker exec fluxbus-db-ci psql -U fluxbus_ci -d fluxbus_ci -c "SELECT version();" 2>&1 && {
        echo "✅ Conexão com PostgreSQL funcionando!"
    } || {
        echo "❌ Ainda há problema com a senha"
        echo "📋 Verificando logs..."
        docker logs fluxbus-db-ci --tail 30
    }
else
    echo "❌ PostgreSQL não está rodando!"
    echo "📋 Logs:"
    docker logs fluxbus-db-ci --tail 50
    exit 1
fi

# Reiniciar backend
echo ""
echo "🔄 Reiniciando backend..."
docker-compose -f docker-compose.ci.yml restart backend-ci || docker-compose -f docker-compose.ci.yml up -d backend-ci

echo "⏳ Aguardando backend iniciar (30s)..."
sleep 30

# Verificar backend
if docker ps | grep -q "fluxbus-backend-ci"; then
    echo "✅ Backend está rodando!"
    echo "📋 Verificando logs do backend (últimas 20 linhas)..."
    docker logs fluxbus-backend-ci --tail 20
else
    echo "❌ Backend não está rodando!"
    echo "📋 Logs:"
    docker logs fluxbus-backend-ci --tail 50
fi

echo ""
echo "✅ Processo concluído!"

