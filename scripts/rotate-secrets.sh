#!/usr/bin/env bash
# ============================================================
# ROTACAO DE SECRETS — executar após o incidente de vazamento
# (secrets commitados em properties, docs e histórico do Git)
#
# Uso:  bash scripts/rotate-secrets.sh
#
# O script gera novos valores e escreve num arquivo local NÃO
# commitado (.secrets-rotation.local). Depois aplique-os:
#   - GitHub Actions secrets
#   - .env da VPS / docker-compose / Coolify / Portainer
#   - Painel da Evolution API (regenerar a chave da instância)
#   - Conta de e-mail (nova senha no provedor SMTP)
# ============================================================
set -euo pipefail

OUT=".secrets-rotation.local"
umask 177   # arquivo legível só pelo dono

echo "=== ROTAÇÃO DE SECRETS FLUXBUS ==="
echo ""

NEW_JWT_SECRET=$(openssl rand -hex 64 2>/dev/null || head -c 64 /dev/urandom | xxd -p -c 128)
NEW_SMTP_PASSWORD=$(openssl rand -base64 24 2>/dev/null | tr -d '/+=' | head -c 24)
NEW_EVOLUTION_KEY=$(openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | xxd -p)

{
  echo "# Gerado em $(date -u '+%Y-%m-%d %H:%M UTC') — NÃO COMMITAR"
  echo "JWT_SECRET=${NEW_JWT_SECRET}"
  echo "MAIL_PASSWORD=${NEW_SMTP_PASSWORD}"
  echo "EVOLUTION_API_KEY=${NEW_EVOLUTION_KEY}"
} > "$OUT"

echo "[ok] Novos valores gerados em: $OUT (arquivo ignorado pelo git)"
echo ""
echo "PRÓXIMOS PASSOS (obrigatórios):"
echo "  1. SMTP: trocar a senha da conta de e-mail no provedor e apontar MAIL_PASSWORD para o novo valor."
echo "  2. Evolution API: regenerar a chave da instância no painel e apontar EVOLUTION_API_KEY."
echo "  3. GitHub Actions: atualizar os secrets do repositório (Settings > Secrets and variables)."
echo "  4. VPS/Produção: atualizar .env / docker-compose / Coolify e reiniciar o backend."
echo "  5. Banco: trocar as senhas dos usuários de banco (estavam em docs commitados)."
echo "  6. Forçar logout geral: os tokens antigos assinados com o secret vazado deixam de"
echo "     validar assim que o novo JWT_SECRET entrar em vigor (efeito automático)."
echo ""
echo "LIMPEZA DO HISTÓRICO DO GIT (senhas em docs antigos permanecem no histórico):"
echo "  git clone --mirror <repo> repo-mirror && cd repo-mirror"
echo "  # usar BFG ou git-filter-repo para remover os arquivos apagados em todos os commits"
echo "  # e depois: git push --force"
echo ""
echo "AVISO: os seguintes valores JÁ ESTÃO COMPROMETIDOS e devem ser considerados públicos:"
echo "  - JWT secret antigo (application.properties e fallback do prod)"
echo "  - Senha SMTP do e-mail securedguard@ (comentários dos properties e docs)"
echo "  - Chave da Evolution API (properties de todos os ambientes)"
