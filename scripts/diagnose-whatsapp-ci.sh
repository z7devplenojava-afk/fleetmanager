#!/bin/bash

echo "🔍 Diagnóstico do WhatsApp Service - CI"
echo "========================================"
echo ""

# Verificar se o container está rodando
echo "1️⃣ Verificando status do container..."
docker ps | grep whatsapp-service-ci

if [ $? -ne 0 ]; then
    echo "❌ Container whatsapp-service-ci NÃO está rodando!"
    echo ""
    echo "📋 Tentando iniciar o container..."
    cd /var/www/fluxbus/ci
    docker-compose -f docker-compose.ci.yml up -d whatsapp-service-ci
    sleep 10
else
    echo "✅ Container whatsapp-service-ci está rodando"
fi

echo ""
echo "2️⃣ Verificando logs do container (últimas 30 linhas)..."
docker logs --tail 30 fluxbus-whatsapp-ci 2>&1

echo ""
echo "3️⃣ Testando conectividade interna (do backend para o WhatsApp service)..."
docker exec fluxbus-backend-ci curl -s -o /dev/null -w "HTTP Code: %{http_code}\n" http://whatsapp-service-ci:3333/health || echo "❌ Backend não consegue acessar o WhatsApp service"

echo ""
echo "4️⃣ Testando health endpoint diretamente..."
curl -s http://localhost:3333/health || echo "❌ Health endpoint não responde"

echo ""
echo "5️⃣ Verificando se o serviço está escutando na porta 3333..."
netstat -tlnp | grep 3333 || ss -tlnp | grep 3333 || echo "⚠️ Porta 3333 não está sendo escutada"

echo ""
echo "6️⃣ Verificando rede Docker..."
docker network inspect z7network | grep -A 5 whatsapp-service-ci || echo "⚠️ Container não está na rede z7network"

echo ""
echo "7️⃣ Verificando variáveis de ambiente do backend..."
docker exec fluxbus-backend-ci env | grep BAILEYS || echo "⚠️ Variável BAILEYS_REST_URL não encontrada"

echo ""
echo "8️⃣ Testando endpoint de inicialização..."
curl -s -X GET "http://localhost:3333/instance/init?key=fluxbus_ci" | head -20 || echo "❌ Endpoint /instance/init não responde"

echo ""
echo "9️⃣ Verificando diretório de sessões..."
ls -la /var/www/fluxbus/ci/whatsapp_sessions/ 2>&1 | head -10 || echo "⚠️ Diretório de sessões não existe ou não tem permissão"

echo ""
echo "========================================"
echo "✅ Diagnóstico concluído!"
echo ""
echo "💡 Se o container não está rodando, execute:"
echo "   cd /var/www/fluxbus/ci"
echo "   docker-compose -f docker-compose.ci.yml up -d whatsapp-service-ci"
echo ""
echo "💡 Para ver logs em tempo real:"
echo "   docker logs -f fluxbus-whatsapp-ci"

