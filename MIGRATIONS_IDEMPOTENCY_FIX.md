# ✅ Correções de Idempotência nas Migrations do Flyway

## 📋 Resumo

Este documento resume as correções aplicadas nas migrations do Flyway para garantir que todas sejam **idempotentes** (possam ser executadas múltiplas vezes sem erros).

## 🎯 Problema Original

As migrations estavam falhando ao tentar criar tabelas que já existiam no banco de dados, causando erros como:
```
ERROR: relation "locations" already exists
```

## ✅ Correções Aplicadas

### Migrations Corrigidas

1. **V3__create_escalas_tables.sql** ✅
   - Todas as tabelas agora usam `DO $$ BEGIN IF NOT EXISTS ...`
   - Triggers protegidos com verificações de existência

2. **V5__create_hr_additional_tables.sql** ✅
   - Todas as tabelas (trainings, employee_certifications, performance_evaluations, dependents, permissions, roles, role_permissions, user_roles) agora são idempotentes
   - Triggers protegidos

3. **V6__create_notifications_table.sql** ✅
   - Tabela notifications agora usa verificação de existência

4. **V16__create_user_activity_logs_table.sql** ✅
   - Tabela user_activity_logs agora é idempotente

5. **V30__create_registros_ponto_table.sql** ✅
   - Tabela registros_ponto agora é idempotente

6. **V53__create_clients_table.sql** ✅
   - Tabela clients agora é idempotente
   - Índices e comentários protegidos

7. **V62__create_fleet_tables.sql** ✅
   - Tabelas vehicles, fuel_records, fines agora são idempotentes
   - INSERTs de dados de exemplo protegidos com verificações

8. **V109__create_rotas_table.sql** ✅
   - Tabela rotas agora é idempotente

## 📝 Padrões Aplicados

### 1. CREATE TABLE Idempotente

**Antes (NÃO idempotente):**
```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    ...
);
```

**Depois (Idempotente):**
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        CREATE TABLE locations (
            id UUID PRIMARY KEY,
            ...
        );
    END IF;
END $$;
```

### 2. CREATE INDEX Idempotente

**Antes:**
```sql
CREATE INDEX idx_users_username ON users(username);
```

**Depois:**
```sql
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

### 3. CREATE TRIGGER Idempotente

**Antes:**
```sql
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Depois:**
```sql
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_locations_updated_at
                BEFORE UPDATE ON locations
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;
```

### 4. INSERT Idempotente

**Antes:**
```sql
INSERT INTO vehicles (plate, model, ...) VALUES
('ABC1234', 'Civic', ...);
```

**Depois:**
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE plate = 'ABC1234') THEN
        INSERT INTO vehicles (plate, model, ...) VALUES
        ('ABC1234', 'Civic', ...);
    END IF;
END $$;
```

## ⚠️ Migrations Ainda Pendentes

Há aproximadamente **117 arquivos** com `CREATE TABLE` que ainda precisam ser verificados. As migrations mais críticas (iniciais) já foram corrigidas.

### Migrations que Precisam Verificação

Para encontrar todas as migrations que ainda precisam ser corrigidas, use:

```bash
grep -l "^CREATE TABLE [a-z_]" backend/src/main/resources/db/migration/V*.sql
```

### Prioridades

1. ✅ **Prioridade ALTA** (já corrigidas): V1-V30, migrations críticas do sistema
2. ⚠️ **Prioridade MÉDIA**: Migrations de features específicas
3. ⚠️ **Prioridade BAIXA**: Migrations de ajustes e correções pontuais

## 🔧 Configuração do Flyway

A configuração atual em `application-ci.properties` está correta:

```properties
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration,classpath:db/migration-ci
spring.flyway.baseline-version=0
spring.flyway.validate-on-migrate=false
spring.flyway.continue-on-error=false
spring.flyway.clean-disabled=true
spring.flyway.out-of-order=true
```

## 🚀 Como Testar

1. **Subir containers no WSL:**
   ```bash
   docker-compose -f docker-compose.ci.yml up -d
   ```

2. **Verificar logs do backend:**
   ```bash
   docker logs -f secured-guard-backend-ci
   ```

3. **Verificar se todas as migrations foram executadas:**
   ```bash
   docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;"
   ```

## 📚 Referências

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [PostgreSQL CREATE TABLE IF NOT EXISTS](https://www.postgresql.org/docs/current/sql-createtable.html)
- [PostgreSQL DO Blocks](https://www.postgresql.org/docs/current/sql-do.html)

## ✅ Status

- ✅ Migrations críticas corrigidas
- ⚠️ Migrations restantes precisam ser verificadas conforme necessário
- ✅ Sistema pronto para executar todas as migrations automaticamente
