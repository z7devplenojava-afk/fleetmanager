# Como Atualizar a Seed com Todos os Funcionários

## Passo a Passo

### 1. Exportar os Funcionários do Banco

Execute um dos scripts abaixo no PostgreSQL para exportar todos os funcionários:

#### Opção A: Usando psql (recomendado)

```bash
psql -U seu_usuario -d seu_banco -f export_employees_simple.sql > employees_inserts.sql
```

#### Opção B: Executando diretamente no psql

```sql
-- Conecte-se ao banco
\c seu_banco

-- Execute o script
\i export_employees_simple.sql

-- Copie os resultados e cole no arquivo V371__seed_all_employees.sql
```

#### Opção C: Usando pg_dump (mais simples)

```bash
pg_dump -U seu_usuario -d seu_banco -t employees --inserts > employees_inserts.sql
```

Depois, edite o arquivo `employees_inserts.sql` e:
1. Remova o `CREATE TABLE` (mantenha apenas os INSERTs)
2. Adicione `ON CONFLICT (id) DO NOTHING;` no final de cada INSERT
3. Copie os INSERTs para o arquivo `V371__seed_all_employees.sql`

### 2. Atualizar a Migration

1. Abra o arquivo `V371__seed_all_employees.sql`
2. Substitua o comentário `-- TODO: Cole aqui os INSERTs...` pelos INSERTs exportados
3. Certifique-se de que cada INSERT tenha `ON CONFLICT (id) DO NOTHING;` no final

### 3. Executar a Migration

A migration será executada automaticamente na próxima vez que o Flyway rodar, ou execute manualmente:

```bash
./mvnw flyway:migrate
```

## Estrutura do INSERT

Cada INSERT deve seguir esta estrutura básica:

```sql
INSERT INTO employees (
    id, user_id, position_id, registration_number, name, cpf, rg, 
    birth_date, marital_status, address, phone, email, 
    unit_id, company_id, hire_date, status, 
    cnh_number, cnh_expiration_date, cnh_category,
    whatsapp, created_at, updated_at
) VALUES (
    'uuid-aqui', 
    'user-id' ou NULL, 
    'position-id' ou NULL,
    'REG001',
    'Nome do Funcionário',
    '123.456.789-00',
    '12.345.678-9',
    '1990-01-15',
    'SOLTEIRO',
    'Endereço completo',
    '(11) 99999-9999',
    'email@example.com',
    'unit-id' ou NULL,
    'company-id' ou NULL,
    '2024-01-01',
    'ACTIVE',
    '12345678901',
    '2025-12-31',
    'B',
    '(11) 99999-9999',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
```

## Campos Opcionais

Alguns campos podem ser NULL. Os principais são:
- `user_id` - pode ser NULL se o funcionário não tem usuário associado
- `position_id` - pode ser NULL
- `unit_id` - pode ser NULL
- `company_id` - pode ser NULL
- `cnh_*` - campos de CNH são opcionais
- `whatsapp` - opcional

## Notas Importantes

1. **IDs**: Certifique-se de que os UUIDs não conflitem com dados existentes
2. **Foreign Keys**: Verifique se os `user_id`, `position_id`, `unit_id` e `company_id` existem no banco
3. **Status**: Use 'ACTIVE', 'INACTIVE', 'ON_LEAVE', etc. conforme o enum definido
4. **Datas**: Use formato 'YYYY-MM-DD' para datas
5. **ON CONFLICT**: Sempre use `ON CONFLICT (id) DO NOTHING;` para evitar erros em execuções repetidas















