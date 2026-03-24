# 🚀 Guia Rápido: Exportar Dados do secured_guard_test para CI

## Opção 1: Script Automatizado (Recomendado)

### No servidor Linux/VPS:

```bash
cd /caminho/para/o/projeto

# Configurar variáveis de ambiente (ajuste conforme necessário)
export DB_USER=postgres
export DB_PASSWORD=sua_senha
export DB_HOST=localhost
export DB_PORT=5432

# Executar script
bash backend/src/main/resources/db/migration-ci/export_and_update_ci_migration.sh
```

O script irá:
- ✅ Conectar ao banco `secured_guard_test`
- ✅ Exportar usuários e user_roles
- ✅ Exportar funcionários
- ✅ Atualizar automaticamente a migration `V999__seed_ci_essential_data.sql`
- ✅ Criar backup da migration original

## Opção 2: Manual (Passo a Passo)

### 1. Conectar ao banco

```bash
psql -U postgres -d secured_guard_test
```

### 2. Exportar usuários

```sql
-- Executar o script de exportação
\i backend/src/main/resources/db/migration-ci/export_users_from_test_db.sql

-- Ou copiar e colar o conteúdo do arquivo diretamente
```

**Copiar os resultados:**
- Primeira query: INSERTs de usuários → colar na seção `7.1` da migration
- Segunda query: INSERTs de user_roles → colar na seção `7.2` da migration

### 3. Exportar funcionários

```sql
-- Executar o script de exportação
\i backend/src/main/resources/db/migration-ci/export_employees_from_test_db.sql
```

**Copiar os resultados:**
- INSERTs de funcionários → colar na seção `8` da migration

### 4. Editar a migration

Abra o arquivo:
```
backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql
```

Cole os INSERTs exportados nas seções correspondentes:
- **Seção 7.1**: Usuários
- **Seção 7.2**: User_roles
- **Seção 8**: Funcionários

## Opção 3: Via Docker (se o banco estiver em container)

```bash
# Exportar usuários
docker exec -i secured-guard-db-test psql -U postgres -d secured_guard_test \
  -f /path/to/export_users_from_test_db.sql > users_export.sql

# Exportar funcionários
docker exec -i secured-guard-db-test psql -U postgres -d secured_guard_test \
  -f /path/to/export_employees_from_test_db.sql > employees_export.sql
```

## 📋 Verificação

Após exportar, verifique:

1. **Usuários exportados:**
   ```bash
   grep -c "INSERT INTO users" users_export.sql
   ```

2. **Funcionários exportados:**
   ```bash
   grep -c "INSERT INTO employees" employees_export.sql
   ```

3. **Sintaxe SQL válida:**
   ```bash
   # No servidor CI
   psql -U postgres -d secured_guard_ci \
     -f backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql \
     --dry-run
   ```

## ⚠️ Importante

- ✅ Todos os INSERTs já incluem `ON CONFLICT (id) DO NOTHING`
- ✅ O usuário `admin@ci` é automaticamente excluído da exportação
- ✅ Faça backup da migration antes de editar
- ✅ Valide a sintaxe SQL antes de fazer commit

## 🐛 Troubleshooting

### Erro: "psql: could not connect to server"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)

### Erro: "database secured_guard_test does not exist"
- Verifique o nome do banco
- Liste os bancos: `psql -U postgres -l`

### Nenhum dado exportado
- Verifique se existem dados no banco:
  ```sql
  SELECT COUNT(*) FROM users WHERE username != 'admin@ci';
  SELECT COUNT(*) FROM employees;
  ```

