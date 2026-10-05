#!/bin/bash

# Script para diagnosticar problemas do WhatsApp no ambiente CI
# Execute na VPS: bash deploy/diagnose-whatsapp-ci.sh

echo "🔍 Diagnóstico do WhatsApp no ambiente CI"
echo "=========================================="
echo ""

# 1. Verificar se o container está rodando
echo "1️⃣ Verificando containers Docker..."
docker ps | grep whatsapp || echo "❌ Container whatsapp-service-ci não está rodando"
echo ""

# 2. Verificar logs do container
echo "2️⃣ Últimas 20 linhas dos logs do WhatsApp:"
docker logs fluxbus-whatsapp-ci --tail 20 2>&1 || echo "❌ Não foi possível ler logs"
echo ""

# 3. Verificar se o container está na rede correta
echo "3️⃣ Verificando redes Docker..."
docker network inspect fluxbus-ci-network | grep whatsapp || echo "⚠️ Container pode não estar na rede"
docker network inspect z7network | grep whatsapp || echo "⚠️ Container pode não estar na rede z7network"
echo ""

# 4. Testar conectividade do backend para o WhatsApp
echo "4️⃣ Testando conectividade do backend para o WhatsApp..."
docker exec fluxbus-backend-ci curl -f http://whatsapp-service-ci:3333/health || echo "❌ Backend não consegue acessar WhatsApp"
echo ""

# 5. Verificar variáveis de ambiente do backend
echo "5️⃣ Variáveis de ambiente do backend relacionadas ao WhatsApp:"
docker exec fluxbus-backend-ci env | grep -i baileys || echo "⚠️ Variáveis BAILEYS não encontradas"
docker exec fluxbus-backend-ci env | grep -i whatsapp || echo "⚠️ Variáveis WHATSAPP não encontradas"
echo ""

# 6. Verificar health check do WhatsApp
echo "6️⃣ Health check do serviço WhatsApp:"
docker exec fluxbus-whatsapp-ci curl -f http://localhost:3333/health || echo "❌ Health check falhou"
echo ""

# 7. Verificar se o serviço está escutando na porta correta
echo "7️⃣ Verificando portas abertas no container WhatsApp:"
docker exec fluxbus-whatsapp-ci netstat -tlnp 2>/dev/null | grep 3333 || docker exec fluxbus-whatsapp-ci ss -tlnp 2>/dev/null | grep 3333 || echo "⚠️ Porta 3333 não encontrada"
echo ""

# 8. Verificar configuração do docker-compose
echo "8️⃣ Verificando configuração do docker-compose.ci.yml:"
grep -A 10 "whatsapp-service-ci" docker-compose.ci.yml | head -15
echo ""

echo "✅ Diagnóstico concluído!"
echo ""
echo "💡 Próximos passos:"
echo "   - Se o container não estiver rodando: docker-compose -f docker-compose.ci.yml up -d whatsapp-service-ci"
echo "   - Se houver erros nos logs: verifique as dependências (postgres, redis)"
echo "   - Se a conectividade falhar: verifique as redes Docker"
