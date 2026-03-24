# 🔧 Como Corrigir Backend que Não Está Rodando na VPS

## 🔍 Problema Identificado

O backend não está rodando porque a **senha do PostgreSQL está incorreta**:
```
FATAL: password authentication failed for user "secured_guard_ci"
```

## ✅ Solução Rápida

### Opção 1: Executar Script de Correção (Recomendado)

Execute na VPS:

```bash
cd /var/www/secured_guard/ci
chmod +x scripts/reset-postgres-password-vps.sh
./scripts/reset-postgres-password-vps.sh
```

### Opção 2: Correção Manual

1. **Conectar na VPS:**
```bash
ssh root@185.225.233.18
cd /var/www/secured_guard/ci
```

2. **Verificar arquivo .env:**
```bash
cat .env | grep POSTGRES_PASSWORD_CI
```

3. **Parar containers:**
```bash
docker-compose -f docker-compose.ci.yml stop backend-ci postgres-ci
```

4. **Remover container do PostgreSQL (mantém dados):**
```bash
docker rm -f secured-guard-db-ci
```

5. **Atualizar senha no .env (se necessário):**
```bash
# Editar .env e garantir que POSTGRES_PASSWORD_CI está correto
nano .env
```

6. **Reiniciar PostgreSQL:**
```bash
docker-compose -f docker-compose.ci.yml up -d postgres-ci
```

7. **Aguardar PostgreSQL iniciar:**
```bash
sleep 30
docker logs secured-guard-db-ci --tail 20
```

8. **Resetar senha do usuário (se necessário):**
```bash
docker exec secured-guard-db-ci psql -U secured_guard_ci -d postgres -c "ALTER USER secured_guard_ci WITH PASSWORD '4KaCiJc6an@7sgbdcid2025';"
```

9. **Reiniciar backend:**
```bash
docker-compose -f docker-compose.ci.yml restart backend-ci
```

10. **Verificar logs:**
```bash
docker logs secured-guard-backend-ci --tail 50
```

## 🔍 Diagnóstico

Para verificar o status completo, execute:

```bash
cd /var/www/secured_guard/ci
chmod +x scripts/check-backend-status-vps.sh
./scripts/check-backend-status-vps.sh
```

## 📋 Verificações Importantes

### 1. Verificar se .env existe e tem a senha correta:
```bash
cd /var/www/secured_guard/ci
cat .env | grep POSTGRES_PASSWORD_CI
```

**Deve mostrar:**
```
POSTGRES_PASSWORD_CI=4KaCiJc6an@7sgbdcid2025
```

### 2. Verificar se docker-compose está lendo o .env:
```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml config | grep POSTGRES_PASSWORD
```

### 3. Verificar logs do PostgreSQL:
```bash
docker logs secured-guard-db-ci --tail 50
```

### 4. Testar conexão manual:
```bash
docker exec secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT version();"
```

## ⚠️ Se o Problema Persistir

### Resetar completamente o banco (vai apagar dados!):

```bash
cd /var/www/secured_guard/ci

# Parar tudo
docker-compose -f docker-compose.ci.yml down

# Remover volume do PostgreSQL
docker volume rm secured-guard_postgres_data_ci

# Garantir que .env está correto
echo "POSTGRES_PASSWORD_CI=4KaCiJc6an@7sgbdcid2025" >> .env

# Reiniciar
docker-compose -f docker-compose.ci.yml up -d
```

## 🔐 Senhas Padrão (se não estiverem no secret)

- **POSTGRES_PASSWORD_CI:** `4KaCiJc6an@7sgbdcid2025`
- **REDIS_PASSWORD:** `redis_ci_2025`

## 📝 Nota

O `docker-compose.ci.yml` foi atualizado para usar `env_file: - .env`, garantindo que as variáveis do arquivo `.env` sejam lidas corretamente.

