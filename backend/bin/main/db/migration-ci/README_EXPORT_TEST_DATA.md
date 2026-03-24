# 📋 Instruções para Exportar Dados do Banco secured_guard_test para CI

Este guia explica como exportar usuários e funcionários do banco `secured_guard_test` e incluí-los na migration de CI.

## 🎯 Objetivo

Popular o ambiente CI com dados reais de usuários e funcionários do banco de teste, garantindo que o ambiente CI tenha os mesmos dados para testes e desenvolvimento.

## 📝 Pré-requisitos

1. Acesso ao banco de dados PostgreSQL `secured_guard_test`
2. Ferramenta de acesso ao PostgreSQL (psql, pgAdmin, DBeaver, etc.)
3. Acesso ao repositório do projeto para editar a migration

## 🔧 Passo a Passo

### 1. Exportar Usuários

#### 1.1. Conectar ao banco secured_guard_test

```bash
psql -U postgres -d secured_guard_test
```

#### 1.2. Executar o script de exportação

```sql
\i backend/src/main/resources/db/migration-ci/export_users_from_test_db.sql
```

Ou copie e cole o conteúdo do arquivo `export_users_from_test_db.sql` diretamente no psql.

#### 1.3. Copiar os resultados

O script gerará dois conjuntos de resultados:

**Primeira query (INSERTs de usuários):**
- Copie todos os INSERTs gerados
- Cole na seção `7.1. USUÁRIOS DO BANCO secured_guard_test` do arquivo `V999__seed_ci_essential_data.sql`

**Segunda query (INSERTs de user_roles):**
- Copie todos os INSERTs gerados
- Cole na seção `7.2. USER_ROLES DOS USUÁRIOS DO BANCO secured_guard_test` do arquivo `V999__seed_ci_essential_data.sql`

### 2. Exportar Funcionários

#### 2.1. Conectar ao banco secured_guard_test

```bash
psql -U postgres -d secured_guard_test
```

#### 2.2. Executar o script de exportação

```sql
\i backend/src/main/resources/db/migration-ci/export_employees_from_test_db.sql
```

Ou copie e cole o conteúdo do arquivo `export_employees_from_test_db.sql` diretamente no psql.

#### 2.3. Copiar os resultados

- Copie todos os INSERTs gerados
- Cole na seção `8. FUNCIONÁRIOS DO BANCO secured_guard_test` do arquivo `V999__seed_ci_essential_data.sql`

## 📁 Localização dos Arquivos

- **Script de exportação de usuários:** `backend/src/main/resources/db/migration-ci/export_users_from_test_db.sql`
- **Script de exportação de funcionários:** `backend/src/main/resources/db/migration-ci/export_employees_from_test_db.sql`
- **Migration de CI:** `backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql`

## ⚠️ Importante

1. **ON CONFLICT DO NOTHING:** Todos os INSERTs gerados já incluem `ON CONFLICT (id) DO NOTHING`, então é seguro executar a migration múltiplas vezes sem criar duplicatas.

2. **Exclusão do admin@ci:** O script de exportação de usuários automaticamente exclui o usuário `admin@ci`, pois ele já está incluído na migration.

3. **Ordem de execução:** A migration executa na seguinte ordem:
   - Usuários essenciais (admin@ci)
   - Usuários do banco de teste (se exportados)
   - User_roles dos usuários do banco de teste (se exportados)
   - Funcionários do banco de teste (se exportados)
   - Funcionários de teste (fallback)

4. **Validação:** Após adicionar os dados, valide a sintaxe SQL antes de fazer commit:
   ```bash
   psql -U postgres -d secured_guard_ci -f backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql --dry-run
   ```

## 🔄 Atualizar Dados

Se precisar atualizar os dados do banco de teste no CI:

1. Execute novamente os scripts de exportação
2. Substitua os INSERTs antigos pelos novos na migration
3. Faça commit e push
4. O próximo deploy do CI executará a migration atualizada

## 📊 Verificar Dados Importados

Após o deploy, verifique se os dados foram importados corretamente:

```sql
-- Verificar usuários importados
SELECT id, username, email, name FROM users ORDER BY username;

-- Verificar funcionários importados
SELECT id, name, registration_number, cpf FROM employees ORDER BY name;

-- Verificar relacionamentos user_roles
SELECT u.username, r.name as role_name 
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.username, r.name;
```

## 🐛 Troubleshooting

### Erro: "column does not exist"
- Verifique se todas as colunas referenciadas existem na tabela
- Execute as migrations do Flyway antes de executar o seed

### Erro: "duplicate key value"
- Os INSERTs já incluem `ON CONFLICT DO NOTHING`, então isso não deveria acontecer
- Verifique se há algum INSERT sem a cláusula ON CONFLICT

### Dados não aparecem após deploy
- Verifique os logs do backend: `docker logs secured-guard-backend-ci`
- Procure por erros relacionados ao Flyway
- Verifique se a migration foi executada: `SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;`

