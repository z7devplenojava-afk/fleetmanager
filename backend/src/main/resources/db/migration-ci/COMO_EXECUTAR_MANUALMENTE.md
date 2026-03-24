# 📋 Como Executar os Scripts Manualmente

Como o `psql` não está no PATH, você pode executar os scripts SQL manualmente usando qualquer cliente PostgreSQL (DBeaver, pgAdmin, etc.).

## 🚀 Passo a Passo

### 1. Conectar ao Banco `secured_guard_test`

Use qualquer cliente PostgreSQL (DBeaver, pgAdmin, DataGrip, etc.) e conecte-se:
- **Host:** `localhost`
- **Porta:** `5432`
- **Database:** `secured_guard_test`
- **Usuário:** `postgressg`
- **Senha:** `1234567` (ou a senha que você configurou)

### 2. Executar Script de Exportação de Usuários

Abra o arquivo `export_users_from_test_db.sql` e execute no cliente PostgreSQL.

**Copie TODOS os resultados** (todos os `INSERT INTO users` e `INSERT INTO user_roles`).

### 3. Executar Script de Exportação de Funcionários

Abra o arquivo `export_employees_from_test_db.sql` e execute no cliente PostgreSQL.

**Copie TODOS os resultados** (todos os `INSERT INTO employees`).

### 4. Colar os INSERTs na Migration

Abra o arquivo `V999__seed_ci_essential_data.sql` e cole os INSERTs nas seções corretas:

#### Seção 7.1 - Usuários
Procure por:
```sql
-- COLE OS INSERTs DE USUÁRIOS AQUI:
```

Cole todos os `INSERT INTO users` aqui.

#### Seção 7.2 - User Roles
Procure por:
```sql
-- COLE OS INSERTs DE USER_ROLES AQUI:
```

Cole todos os `INSERT INTO user_roles` aqui.

#### Seção 8 - Funcionários
Procure por:
```sql
-- COLE OS INSERTs DE FUNCIONÁRIOS AQUI:
```

Cole todos os `INSERT INTO employees` aqui.

### 5. Salvar e Fazer Commit

Depois de colar todos os INSERTs, salve o arquivo `V999__seed_ci_essential_data.sql` e faça commit:

```bash
git add backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql
git commit -m "Adicionar INSERTs de usuários e funcionários do banco test para CI"
git push
```

## ✅ Pronto!

No próximo deploy do CI, o Flyway vai executar a migration V999 e popular o banco `secured_guard_ci` com todos os dados do `secured_guard_test`.







