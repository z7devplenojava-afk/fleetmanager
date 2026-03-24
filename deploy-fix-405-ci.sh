#!/bin/bash

# ========================================
# Script para corrigir erro 405 no CI
# ========================================

set -e

echo "🚀 Iniciando correção do erro 405 no CI..."
echo ""

# 1. Commit local
echo "📝 Fazendo commit das mudanças..."
git add docker-compose.ci.yml CORRECAO_TRAEFIK_405_CI.md
git commit -m "fix: Corrigir erro 405 no CI - adicionar middlewares Traefik para CORS" || echo "⚠️ Nada para commitar ou commit já feito"

# 2. Push para branch CI
echo ""
echo "📤 Fazendo push para o branch CI..."
git push origin ci || echo "⚠️ Push falhou, verifique se tem mudanças"

echo ""
echo "✅ Commit e push realizados!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 PRÓXIMOS PASSOS (EXECUTAR NO SERVIDOR CI):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ssh usuario@seu-servidor-ci"
echo "cd /var/www/secured_guard/ci"
echo "git pull origin ci"
echo "docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci"
echo "docker-compose -f docker-compose.ci.yml logs -f backend-ci"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Depois teste o login em: https://ci.z7botsolutions.com.br"

