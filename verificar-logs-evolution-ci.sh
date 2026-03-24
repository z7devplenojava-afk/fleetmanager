#!/bin/bash

echo "========================================"
echo "  VERIFICANDO LOGS EVOLUTION API"
echo "========================================"
echo ""

ssh root@ci.z7botsolutions.com.br << 'ENDSSH'

echo "Logs Evolution API (últimas 50 linhas):"
echo ""
docker logs evolution-api-ci --tail 50

echo ""
echo "========================================"
echo "  PROCURANDO POR LOOP"
echo "========================================"
echo ""

LOOP_COUNT=$(docker logs evolution-api-ci --tail 50 | grep -c "ChannelStartupService" || echo "0")

if [ "$LOOP_COUNT" -gt 5 ]; then
    echo "❌ LOOP DETECTADO ($LOOP_COUNT vezes)!"
    echo ""
    echo "Mesmo problema do Windows persiste no Linux!"
    echo ""
    echo "SOLUÇÃO: Usar Meta Cloud API"
else
    echo "✅ SEM LOOP ($LOOP_COUNT vezes)"
    echo ""
    echo "QR Code vazio pode ser outro problema."
    echo "Tentando deletar e recriar instância..."
fi

ENDSSH

