# Resolver Checkout Git e Atualizar VPS CI

## Problema
- Arquivos locais (`docker-compose.ci.yml` e `nginx/ci.conf`) estão conflitando com o checkout
- Serviços no docker-compose são `backend-ci` e `frontend-ci`, não `backend` e `frontend`

## Solução: Comandos para Executar na VPS

```bash
# 1. Navegar para diretório
cd /var/www/secured_guard/ci

# 2. Fazer backup dos arquivos locais que conflitam
cp docker-compose.ci.yml /tmp/docker-compose.ci.yml.local
cp -r nginx /tmp/nginx.local

# 3. Remover arquivos conflitantes temporariamente
mv docker-compose.ci.yml /tmp/docker-compose.ci.yml.backup
mv nginx /tmp/nginx.backup

# 4. Fazer checkout do branch CI
git checkout -b ci origin/ci

# 5. Restaurar arquivos locais (se necessário manter configurações locais)
# OU usar os arquivos do repositório (recomendado)
# Se quiser manter local: cp /tmp/docker-compose.ci.yml.local docker-compose.ci.yml
# Se quiser usar do repo: deixar como está (já foi feito checkout)

# 6. Verificar status
git status
git log -1

# 7. Parar containers
docker-compose -f docker-compose.ci.yml down

# 8. Fazer pull das imagens atualizadas do Docker Hub
docker pull z7design/secured-guard-backend:ci
docker pull z7design/secured-guard-frontend:ci
docker pull z7design/secured-guard-whatsapp:ci

# 9. Recriar containers (usando nomes corretos dos serviços)
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always --remove-orphans

# 10. Verificar status
docker-compose -f docker-compose.ci.yml ps

# 11. Verificar logs
docker logs secured-guard-frontend-ci --tail 20
docker logs secured-guard-backend-ci --tail 20
```

## Script Completo (Copiar e Colar)

```bash
#!/bin/bash
set -e

echo "🔄 Resolvendo checkout e atualizando VPS CI..."

cd /var/www/secured_guard/ci

# Backup
echo "💾 Fazendo backup..."
cp docker-compose.ci.yml /tmp/docker-compose.ci.yml.local 2>/dev/null || true
cp -r nginx /tmp/nginx.local 2>/dev/null || true
cp .env /tmp/.env.backup 2>/dev/null || true

# Remover conflitos
echo "🗑️  Removendo arquivos conflitantes..."
mv docker-compose.ci.yml /tmp/docker-compose.ci.yml.backup 2>/dev/null || true
mv nginx /tmp/nginx.backup 2>/dev/null || true

# Checkout
echo "📥 Fazendo checkout do branch CI..."
git checkout -b ci origin/ci || git checkout ci

# Restaurar .env (importante!)
echo "📋 Restaurando .env..."
cp /tmp/.env.backup .env 2>/dev/null || true

# Verificar
echo "✅ Verificando..."
git status
git log -1 --oneline

# Parar containers
echo "🛑 Parando containers..."
docker-compose -f docker-compose.ci.yml down

# Pull imagens
echo "📥 Fazendo pull das imagens atualizadas..."
docker pull z7design/secured-guard-backend:ci || echo "⚠️  Erro ao fazer pull do backend"
docker pull z7design/secured-guard-frontend:ci || echo "⚠️  Erro ao fazer pull do frontend"
docker pull z7design/secured-guard-whatsapp:ci || echo "⚠️  Erro ao fazer pull do whatsapp"

# Recriar containers
echo "🚀 Recriando containers..."
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always --remove-orphans

# Aguardar
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar
echo "✅ Verificando status..."
docker-compose -f docker-compose.ci.yml ps

echo "🎉 Concluído!"
```

## Como o Deploy Automático Funciona

O GitHub Actions workflow (`deploy-ci-docker.yml`) faz:

1. **Build** das imagens Docker (backend, frontend, whatsapp)
2. **Push** para Docker Hub (`z7design/secured-guard-*:ci`)
3. **SSH na VPS** e executa:
   - `docker pull` das imagens atualizadas
   - `docker-compose up -d --force-recreate` para recriar containers

**IMPORTANTE:** O deploy automático NÃO atualiza o código Git na VPS. Ele apenas:
- Faz pull das imagens Docker atualizadas
- Recria os containers

Para ter o código Git atualizado na VPS, você precisa fazer o checkout manualmente (como estamos fazendo agora).

## Atualização Futura

Após configurar o Git, para atualizar:

### Opção 1: Apenas Pull de Imagens (Deploy Automático)
```bash
# O GitHub Actions já faz isso automaticamente quando você faz push para branch 'ci'
# Mas você pode fazer manualmente:
cd /var/www/secured_guard/ci
docker pull z7design/secured-guard-backend:ci
docker pull z7design/secured-guard-frontend:ci
docker-compose -f docker-compose.ci.yml up -d --force-recreate
```

### Opção 2: Atualizar Código Git + Pull Imagens
```bash
cd /var/www/secured_guard/ci
git pull origin ci
docker pull z7design/secured-guard-backend:ci
docker pull z7design/secured-guard-frontend:ci
docker-compose -f docker-compose.ci.yml up -d --force-recreate
```

## Nomes Corretos dos Serviços

No `docker-compose.ci.yml`, os serviços são:
- `backend-ci` (não `backend`)
- `frontend-ci` (não `frontend`)
- `postgres-ci`
- `redis-ci`
- `nginx-ci`
- `whatsapp-service-ci`

Para reconstruir apenas um serviço:
```bash
docker-compose -f docker-compose.ci.yml build --no-cache backend-ci
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci
```
