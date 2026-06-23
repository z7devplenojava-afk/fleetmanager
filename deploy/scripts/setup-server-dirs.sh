#!/usr/bin/env bash
# Cria a estrutura de pastas FluxBus no VPS.
# Uso no servidor: sudo bash deploy/scripts/setup-server-dirs.sh

set -euo pipefail

create_env_dirs() {
  local base="$1"
  mkdir -p \
    "${base}/app" \
    "${base}/data/uploads" \
    "${base}/data/holerites" \
    "${base}/data/logs" \
    "${base}/data/backups" \
    "${base}/data/whatsapp-sessions"
}

echo "Criando estrutura FluxBus..."

create_env_dirs "/var/www/fluxbus"
create_env_dirs "/var/www/fluxbus/dev"
create_env_dirs "/ci"

# Permissões para containers (ajuste o usuário se necessário)
chown -R root:root /var/www/fluxbus /ci 2>/dev/null || true
chmod -R 755 /var/www/fluxbus /ci

echo "OK — estrutura criada:"
echo "  PROD: /var/www/fluxbus"
echo "  DEV:  /var/www/fluxbus/dev"
echo "  CI:   /ci"
echo ""
echo "Coolify: http://198.7.116.227:8000"
