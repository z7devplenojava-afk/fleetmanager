# Gerenciamento de Múltiplos Ambientes

Este guia explica como gerenciar os ambientes isolados do SecuredGuard.

## 🏗️ Arquitetura

Cada ambiente possui sua própria stack completa:

| Ambiente | URL | Backend Port | DB Port | Frontend Port |
|----------|-----|--------------|---------|---------------|
| **Produção** | securedguard.z7botsolutions.com.br | 8080 | 5432 | 3000 |
| **Desenvolvimento** | dev.z7botsolutions.com.br | 8081 | 5433 | 3001 |
| **CI** | ci.z7botsolutions.com.br | 8082 | 5434 | 3002 |
| **Test** | test.z7botsolutions.com.br | 8083 | 5435 | 3003 |

## 📦 Containers por Ambiente

Cada ambiente tem:
- **PostgreSQL** (banco de dados dedicado)
- **Redis** (cache dedicado)
- **Backend** (API Spring Boot)
- **Frontend** (React/Vite)

## 🚀 Gerenciamento Rápido

### Script de Gerenciamento

```bash
# Sintaxe
./deploy/manage-environments.sh [ambiente] [ação]

# Exemplos
./deploy/manage-environments.sh prod up      # Subir produção
./deploy/manage-environments.sh dev restart  # Reiniciar desenvolvimento
./deploy/manage-environments.sh ci logs      # Ver logs do CI
./deploy/manage-environments.sh test down    # Parar test
./deploy/manage-environments.sh all ps       # Status de todos
```

### Ações Disponíveis

- `up` - Subir o ambiente
- `down` - Parar o ambiente
- `restart` - Reiniciar o ambiente
- `logs` - Ver logs (tail -f)
- `ps` - Status dos containers
- `rebuild` - Rebuild e reiniciar
- `clean` - Parar e limpar volumes (⚠️ remove dados)

## 🔧 Comandos Diretos

### Subir todos os ambientes
```bash
cd /opt/secured-guard

# Criar rede (apenas uma vez)
docker network create secured-guard || true

# Subir ambientes
docker compose -f deploy/docker-compose.env-prod.yml up -d
docker compose -f deploy/docker-compose.env-dev.yml up -d
docker compose -f deploy/docker-compose.env-ci.yml up -d
docker compose -f deploy/docker-compose.env-test.yml up -d

# Subir Nginx
docker compose -f deploy/docker-compose.nginx.yml up -d
```

### Gerenciar ambiente específico

**Produção:**
```bash
cd /opt/secured-guard

# Subir
docker compose -f deploy/docker-compose.env-prod.yml up -d

# Status
docker compose -f deploy/docker-compose.env-prod.yml ps

# Logs
docker compose -f deploy/docker-compose.env-prod.yml logs -f

# Restart
docker compose -f deploy/docker-compose.env-prod.yml restart

# Parar
docker compose -f deploy/docker-compose.env-prod.yml down
```

**Desenvolvimento:**
```bash
cd /opt/secured-guard

# Subir
docker compose -f deploy/docker-compose.env-dev.yml up -d

# Acessar banco
docker exec -it secured-guard-postgres-dev psql -U postgressg -d secured_guard_dev

# Restart backend
docker compose -f deploy/docker-compose.env-dev.yml restart backend-dev

# Ver logs do backend
docker compose -f deploy/docker-compose.env-dev.yml logs -f backend-dev
```

**CI:**
```bash
cd /opt/secured-guard

# Subir
docker compose -f deploy/docker-compose.env-ci.yml up -d

# Rebuild backend
docker compose -f deploy/docker-compose.env-ci.yml up -d --build backend-ci

# Logs
docker compose -f deploy/docker-compose.env-ci.yml logs -f
```

**Test:**
```bash
cd /opt/secured-guard

# Subir
docker compose -f deploy/docker-compose.env-test.yml up -d

# Limpar banco (recrear volumes)
docker compose -f deploy/docker-compose.env-test.yml down -v
docker compose -f deploy/docker-compose.env-test.yml up -d
```

## 🗄️ Acessar Banco de Dados

### Via DBeaver (Remoto)

Cada ambiente tem seu próprio banco:

**Produção:**
- Host: 185.225.233.18
- Port: 5432
- Database: secured_guard_prod
- User: postgressg
- Password: [senha prod]

**Desenvolvimento:**
- Host: 185.225.233.18
- Port: 5433
- Database: secured_guard_dev
- User: postgressg
- Password: [senha dev]

**CI:**
- Host: 185.225.233.18
- Port: 5434
- Database: secured_guard_ci
- User: postgressg
- Password: [senha ci]

**Test:**
- Host: 185.225.233.18
- Port: 5435
- Database: secured_guard_test
- User: postgressg
- Password: [senha test]

### Via Container (VPS)

```bash
# Produção
docker exec -it secured-guard-postgres-prod psql -U postgressg -d secured_guard_prod

# Desenvolvimento
docker exec -it secured-guard-postgres-dev psql -U postgressg -d secured_guard_dev

# CI
docker exec -it secured-guard-postgres-ci psql -U postgressg -d secured_guard_ci

# Test
docker exec -it secured-guard-postgres-test psql -U postgressg -d secured_guard_test
```

## 🔄 Migrações de Banco

### Aplicar migrações em um ambiente

```bash
# Produção
docker run --rm --network secured-guard \
  -v /opt/secured-guard/backend/src/main/resources/db/migration:/flyway/sql \
  -e FLYWAY_URL="jdbc:postgresql://postgres-prod:5432/secured_guard_prod" \
  -e FLYWAY_USER="postgressg" \
  -e FLYWAY_PASSWORD="[senha]" \
  flyway/flyway:9-alpine \
  -validateMigrationNaming=false \
  migrate

# Desenvolvimento
docker run --rm --network secured-guard \
  -v /opt/secured-guard/backend/src/main/resources/db/migration:/flyway/sql \
  -e FLYWAY_URL="jdbc:postgresql://postgres-dev:5432/secured_guard_dev" \
  -e FLYWAY_USER="postgressg" \
  -e FLYWAY_PASSWORD="[senha]" \
  flyway/flyway:9-alpine \
  -validateMigrationNaming=false \
  migrate
```

## 📊 Monitoramento

### Ver status de todos os ambientes
```bash
echo "=== PRODUÇÃO ==="
docker compose -f deploy/docker-compose.env-prod.yml ps

echo "=== DESENVOLVIMENTO ==="
docker compose -f deploy/docker-compose.env-dev.yml ps

echo "=== CI ==="
docker compose -f deploy/docker-compose.env-ci.yml ps

echo "=== TEST ==="
docker compose -f deploy/docker-compose.env-test.yml ps

echo "=== NGINX ==="
docker compose -f deploy/docker-compose.nginx.yml ps
```

### Health checks
```bash
# Produção
curl https://securedguard.z7botsolutions.com.br/api/health

# Desenvolvimento
curl https://dev.z7botsolutions.com.br/api/health

# CI
curl https://ci.z7botsolutions.com.br/api/health

# Test
curl https://test.z7botsolutions.com.br/api/health
```

## 🛠️ Troubleshooting

### Ambiente não responde
```bash
# Verificar status
./deploy/manage-environments.sh [env] ps

# Ver logs
./deploy/manage-environments.sh [env] logs

# Reiniciar
./deploy/manage-environments.sh [env] restart
```

### Erro no banco de dados
```bash
# Acessar banco
docker exec -it secured-guard-postgres-[env] psql -U postgressg -d secured_guard_[env]

# Verificar logs
docker logs secured-guard-postgres-[env]

# Recriar (⚠️ perde dados)
docker compose -f deploy/docker-compose.env-[env].yml down -v
docker compose -f deploy/docker-compose.env-[env].yml up -d
```

### Rebuild completo
```bash
# Parar tudo
docker compose -f deploy/docker-compose.env-prod.yml down
docker compose -f deploy/docker-compose.env-dev.yml down
docker compose -f deploy/docker-compose.env-ci.yml down
docker compose -f deploy/docker-compose.env-test.yml down
docker compose -f deploy/docker-compose.nginx.yml down

# Rebuild e subir
docker compose -f deploy/docker-compose.env-prod.yml up -d --build
docker compose -f deploy/docker-compose.env-dev.yml up -d --build
docker compose -f deploy/docker-compose.env-ci.yml up -d --build
docker compose -f deploy/docker-compose.env-test.yml up -d --build
docker compose -f deploy/docker-compose.nginx.yml up -d
```

## 💾 Backup

### Backup de um ambiente
```bash
# Exemplo: backup do ambiente de produção
docker exec secured-guard-postgres-prod pg_dump -U postgressg secured_guard_prod > backup_prod_$(date +%Y%m%d).sql

# Restaurar
cat backup_prod_20251201.sql | docker exec -i secured-guard-postgres-prod psql -U postgressg -d secured_guard_prod
```

## 🔐 Segurança

- Cada ambiente tem seu próprio banco de dados isolado
- Senhas diferentes por ambiente (usar secrets)
- Portas expostas apenas necessárias
- Logs separados por ambiente
- Volumes isolados (dados não compartilhados)

## 📞 Suporte

Em caso de problemas:
1. Verificar status: `./deploy/manage-environments.sh [env] ps`
2. Ver logs: `./deploy/manage-environments.sh [env] logs`
3. Reiniciar: `./deploy/manage-environments.sh [env] restart`
4. Health check: `curl https://[env].z7botsolutions.com.br/api/health`
