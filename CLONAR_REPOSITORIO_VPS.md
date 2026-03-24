# Guia: Clonar e Configurar Repositório Git na VPS CI

## Problema Identificado
O diretório `/var/www/secured_guard/ci` não é um repositório Git. O código precisa ser clonado do repositório remoto.

## Solução: Clonar Repositório e Configurar

### Opção 1: Clonar Repositório em Diretório Temporário e Copiar Arquivos

```bash
# 1. Criar diretório temporário
cd /tmp
git clone https://github.com/zemarioramos/secured-guard.git secured-guard-temp
cd secured-guard-temp

# 2. Mudar para branch CI
git checkout ci

# 3. Parar containers atuais (se estiverem rodando)
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml down

# 4. Fazer backup dos arquivos importantes
cp docker-compose.ci.yml /tmp/docker-compose.ci.yml.backup
cp .env /tmp/.env.backup

# 5. Copiar código atualizado
cp -r /tmp/secured-guard-temp/frontend/* /var/www/secured_guard/ci/frontend/ 2>/dev/null || true
cp -r /tmp/secured-guard-temp/backend/* /var/www/secured_guard/ci/backend/ 2>/dev/null || true

# 6. Restaurar arquivos de configuração
cp /tmp/docker-compose.ci.yml.backup /var/www/secured_guard/ci/docker-compose.ci.yml
cp /tmp/.env.backup /var/www/secured_guard/ci/.env

# 7. Limpar diretório temporário
rm -rf /tmp/secured-guard-temp
```

### Opção 2: Clonar Repositório Diretamente no Diretório (Recomendado)

```bash
# 1. Fazer backup dos arquivos importantes
cd /var/www/secured_guard/ci
cp docker-compose.ci.yml /tmp/docker-compose.ci.yml.backup
cp .env /tmp/.env.backup

# 2. Parar containers
docker-compose -f docker-compose.ci.yml down

# 3. Mover diretório atual para backup
cd /var/www/secured_guard
mv ci ci.backup.$(date +%Y%m%d_%H%M%S)

# 4. Clonar repositório
git clone https://github.com/zemarioramos/secured-guard.git ci
cd ci

# 5. Mudar para branch CI
git checkout ci

# 6. Restaurar arquivos de configuração
cp /tmp/docker-compose.ci.yml.backup docker-compose.ci.yml
cp /tmp/.env.backup .env

# 7. Copiar dados importantes do backup (se necessário)
# - backups/
# - postgres_data/
# - redis_data/
# - uploads/
# - logs/
# - etc.

# 8. Reconstruir containers
docker-compose -f docker-compose.ci.yml build --no-cache frontend backend
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always --remove-orphans
```

### Opção 3: Inicializar Git no Diretório Existente (Mais Seguro)

```bash
# 1. Parar containers
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml down

# 2. Fazer backup
cp docker-compose.ci.yml /tmp/docker-compose.ci.yml.backup
cp .env /tmp/.env.backup

# 3. Inicializar Git
git init
git remote add origin https://github.com/zemarioramos/secured-guard.git
git fetch origin
git checkout -b ci origin/ci

# 4. Restaurar arquivos de configuração
cp /tmp/docker-compose.ci.yml.backup docker-compose.ci.yml
cp /tmp/.env.backup .env

# 5. Reconstruir containers
docker-compose -f docker-compose.ci.yml build --no-cache frontend backend
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always --remove-orphans
```

## Script Completo (Opção 3 - Recomendada)

```bash
#!/bin/bash
set -e

echo "🔄 Configurando repositório Git na VPS CI..."

# 1. Navegar para diretório
cd /var/www/secured_guard/ci
echo "📁 Diretório: $(pwd)"

# 2. Parar containers
echo "🛑 Parando containers..."
docker-compose -f docker-compose.ci.yml down || true

# 3. Fazer backup
echo "💾 Fazendo backup de arquivos importantes..."
mkdir -p /tmp/vps_ci_backup
cp docker-compose.ci.yml /tmp/vps_ci_backup/ 2>/dev/null || true
cp .env /tmp/vps_ci_backup/ 2>/dev/null || true

# 4. Inicializar Git
echo "📥 Inicializando repositório Git..."
if [ -d ".git" ]; then
    echo "⚠️  Repositório Git já existe. Atualizando..."
    git fetch origin
    git checkout ci || git checkout -b ci origin/ci
    git reset --hard origin/ci
else
    echo "🆕 Inicializando novo repositório Git..."
    git init
    git remote add origin https://github.com/zemarioramos/secured-guard.git || git remote set-url origin https://github.com/zemarioramos/secured-guard.git
    git fetch origin
    git checkout -b ci origin/ci
fi

# 5. Restaurar arquivos de configuração
echo "📋 Restaurando arquivos de configuração..."
cp /tmp/vps_ci_backup/docker-compose.ci.yml . 2>/dev/null || true
cp /tmp/vps_ci_backup/.env . 2>/dev/null || true

# 6. Verificar último commit
echo "✅ Código atualizado. Último commit:"
git log -1 --oneline

# 7. Reconstruir frontend (se necessário)
if [ -d "frontend" ]; then
    echo "🔨 Reconstruindo frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

# 8. Reconstruir containers
echo "🔨 Reconstruindo containers (sem cache)..."
docker-compose -f docker-compose.ci.yml build --no-cache frontend backend || docker-compose -f docker-compose.ci.yml build --no-cache

# 9. Recriar containers
echo "🚀 Recriando containers..."
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always --remove-orphans

# 10. Aguardar inicialização
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# 11. Verificar status
echo "✅ Verificando status..."
docker-compose -f docker-compose.ci.yml ps

echo "🎉 Configuração completa!"
echo ""
echo "📝 Para atualizar no futuro, execute:"
echo "   cd /var/www/secured_guard/ci"
echo "   git pull origin ci"
echo "   docker-compose -f docker-compose.ci.yml build --no-cache frontend backend"
echo "   docker-compose -f docker-compose.ci.yml up -d --force-recreate"
```

## Comandos Rápidos (Executar na VPS)

```bash
# Executar script completo
cd /var/www/secured_guard/ci
bash <(curl -s https://raw.githubusercontent.com/zemarioramos/secured-guard/ci/CLONAR_REPOSITORIO_VPS.md) || {

# Ou executar manualmente:
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml down
cp docker-compose.ci.yml /tmp/ && cp .env /tmp/
git init
git remote add origin https://github.com/zemarioramos/secured-guard.git
git fetch origin
git checkout -b ci origin/ci
cp /tmp/docker-compose.ci.yml . && cp /tmp/.env .
docker-compose -f docker-compose.ci.yml build --no-cache
docker-compose -f docker-compose.ci.yml up -d --force-recreate
}
```

## Verificação

Após executar os comandos, verificar:

```bash
# 1. Verificar se Git está funcionando
cd /var/www/secured_guard/ci
git status
git log -1

# 2. Verificar containers
docker-compose -f docker-compose.ci.yml ps

# 3. Verificar logs
docker logs secured-guard-frontend-ci --tail 20
docker logs secured-guard-backend-ci --tail 20

# 4. Testar acesso
curl -I https://ci.z7botsolutions.com.br
```

## Notas Importantes

1. **Backup**: Sempre faça backup dos arquivos `.env` e `docker-compose.ci.yml` antes de qualquer operação
2. **Dados**: Os diretórios `postgres_data/`, `redis_data/`, `uploads/`, `logs/` não devem ser sobrescritos
3. **Permissões**: Verificar se as permissões dos arquivos estão corretas após o clone
4. **Credenciais**: O arquivo `.env` contém credenciais sensíveis - não commitar no Git

## Próximos Passos

Após configurar o Git, para atualizar no futuro:

```bash
cd /var/www/secured_guard/ci
git pull origin ci
docker-compose -f docker-compose.ci.yml build --no-cache frontend backend
docker-compose -f docker-compose.ci.yml up -d --force-recreate
```
