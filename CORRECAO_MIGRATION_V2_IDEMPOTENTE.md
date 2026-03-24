# ✅ Correção: Migration V2 Idempotente

## ❌ Problema Identificado

O erro `ERROR: relation "units" already exists` ocorria porque:

1. A tabela `units` já existe no banco de dados CI
2. O Flyway não tinha a migration V2 registrada no histórico (`flyway_schema_history`)
3. Ao tentar executar V2 novamente, o Flyway falhava ao tentar criar uma tabela que já existia
4. Como a migration falhava, o Spring Boot não iniciava
5. O nginx retornava 502 porque não conseguia conectar ao backend

## ✅ Solução Implementada

A migration `V2__create_hr_tables.sql` foi tornada **idempotente** usando blocos `DO $$` com verificações `IF NOT EXISTS`:

### Antes:
```sql
CREATE TABLE units (
    id UUID PRIMARY KEY,
    ...
);
```

### Depois:
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        CREATE TABLE units (
            id UUID PRIMARY KEY,
            ...
        );
    END IF;
END $$;
```

### Tabelas Corrigidas:
- ✅ `units`
- ✅ `positions`
- ✅ `employees`
- ✅ `documents`
- ✅ `benefits`
- ✅ `scale_histories`
- ✅ `occurrences`
- ✅ `payrolls`
- ✅ `epis`
- ✅ `payroll_items`

### Índices e Triggers:
- ✅ Todos os índices agora usam `CREATE INDEX IF NOT EXISTS`
- ✅ Todos os triggers são recriados com `DROP TRIGGER IF EXISTS` antes de criar

## 🚀 Próximos Passos

### 1. Commit e Push
```bash
git add backend/src/main/resources/db/migration/V2__create_hr_tables.sql
git commit -m "fix: Tornar migration V2 idempotente para resolver erro 'units already exists'"
git push origin ci
```

### 2. No Servidor CI

Após o deploy, o Flyway deve conseguir executar a migration V2 mesmo que as tabelas já existam:

```bash
# Verificar logs do backend
docker logs secured-guard-backend-ci | grep -i flyway

# Verificar se V2 foi registrada no histórico
docker exec secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT version, description, installed_on FROM flyway_schema_history WHERE version = '2';"
```

### 3. Se o Problema Persistir

Se ainda houver problemas, você pode registrar manualmente a migration V2 no histórico do Flyway:

```sql
-- Conectar ao banco CI
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci

-- Registrar V2 como executada (se as tabelas já existem)
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
SELECT 
    COALESCE(MAX(installed_rank), 0) + 1,
    '2',
    'create hr tables',
    'SQL',
    'V2__create_hr_tables.sql',
    0,
    current_user,
    CURRENT_TIMESTAMP,
    0,
    true
FROM flyway_schema_history
WHERE NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '2');
```

## 📋 Verificação

Após o deploy, verifique:

1. ✅ Backend inicia sem erros do Flyway
2. ✅ Nginx consegue conectar ao backend (sem mais 502)
3. ✅ Endpoints `/api/health`, `/api/units`, `/api/companies` respondem corretamente
4. ✅ Migration V2 aparece no histórico do Flyway

## 🎯 Benefícios

- ✅ Migration pode ser executada múltiplas vezes sem erros
- ✅ Funciona mesmo se as tabelas já existirem
- ✅ Não requer limpeza manual do banco
- ✅ Mais resiliente a falhas parciais de deploy






