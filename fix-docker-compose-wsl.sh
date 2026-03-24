#!/bin/bash
# Script para atualizar docker-compose.ci.yml no WSL, substituindo bind mounts por volumes nomeados

echo "🔧 Atualizando docker-compose.ci.yml no WSL..."

# Fazer backup do arquivo atual
cp docker-compose.ci.yml docker-compose.ci.yml.backup 2>/dev/null || true

# Verificar se o arquivo existe
if [ ! -f "docker-compose.ci.yml" ]; then
    echo "❌ Arquivo docker-compose.ci.yml não encontrado!"
    exit 1
fi

# Substituir todos os bind mounts por volumes nomeados usando sed
sed -i 's|/var/www/secured_guard/ci/postgres_data:/var/lib/postgresql/data|postgres_data_ci:/var/lib/postgresql/data|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/redis_data:/data|redis_data_ci:/data|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/uploads:/var/www/secured_guard/ci/uploads|uploads_ci:/var/www/secured_guard/ci/uploads|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/logs:/var/www/secured_guard/ci/logs|logs_ci:/var/www/secured_guard/ci/logs|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/whatsapp_sessions:/app/sessions|whatsapp_sessions_ci:/app/sessions|g' docker-compose.ci.yml

# Adicionar seção de volumes no final se não existir
if ! grep -q "^volumes:" docker-compose.ci.yml; then
    echo "" >> docker-compose.ci.yml
    echo "# ========================================" >> docker-compose.ci.yml
    echo "# VOLUMES CI (usando volumes nomeados para WSL)" >> docker-compose.ci.yml
    echo "# ========================================" >> docker-compose.ci.yml
    echo "volumes:" >> docker-compose.ci.yml
    echo "  postgres_data_ci:" >> docker-compose.ci.yml
    echo "    driver: local" >> docker-compose.ci.yml
    echo "  redis_data_ci:" >> docker-compose.ci.yml
    echo "    driver: local" >> docker-compose.ci.yml
    echo "  uploads_ci:" >> docker-compose.ci.yml
    echo "    driver: local" >> docker-compose.ci.yml
    echo "  logs_ci:" >> docker-compose.ci.yml
    echo "    driver: local" >> docker-compose.ci.yml
    echo "  whatsapp_sessions_ci:" >> docker-compose.ci.yml
    echo "    driver: local" >> docker-compose.ci.yml
fi

# Corrigir rede z7network para não ser external
sed -i 's|z7network:|z7network:\n    external: false\n    driver: bridge|g' docker-compose.ci.yml || true

# Verificar se ainda há bind mounts problemáticos
if grep -q "/var/www.*:" docker-compose.ci.yml; then
    echo "⚠️  Ainda há bind mounts no arquivo. Verifique manualmente."
    grep "/var/www.*:" docker-compose.ci.yml
else
    echo "✅ Arquivo atualizado com sucesso!"
fi

echo ""
echo "Próximos passos:"
echo "  1. docker-compose -f docker-compose.ci.yml down -v"
echo "  2. docker-compose -f docker-compose.ci.yml up -d"





