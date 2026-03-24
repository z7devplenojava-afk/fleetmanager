# 🚀 Como Gerar INSERTs e Atualizar a Migration

## Passo a Passo Simples

### 1. Instalar dependência (se necessário)

```bash
pip install psycopg2-binary
```

### 2. Configurar credenciais do banco

```bash
# Windows PowerShell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_USER="postgressg"
$env:DB_PASSWORD="sua_senha_aqui"

# Linux/Mac
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgressg
export DB_PASSWORD=sua_senha_aqui
```

### 3. Executar o script

```bash
cd backend/src/main/resources/db/migration-ci
python generate_inserts_and_update_migration.py
```

### 4. Pronto!

O script irá:
- ✅ Conectar ao banco `secured_guard_test`
- ✅ Gerar todos os INSERTs de usuários, user_roles e funcionários
- ✅ Atualizar automaticamente a migration `V999__seed_ci_essential_data.sql`
- ✅ Criar um backup da migration original

### 5. Fazer commit

```bash
git add backend/src/main/resources/db/migration-ci/V999__seed_ci_essential_data.sql
git commit -m "Atualizar seed CI com dados do banco de teste"
git push
```

## O que o script faz

1. **Conecta** ao banco `secured_guard_test`
2. **Exporta** todos os usuários (exceto admin@ci)
3. **Exporta** todos os user_roles
4. **Exporta** todos os funcionários
5. **Atualiza** a migration V999 automaticamente nas seções:
   - `7.1.1` - INSERTs de usuários
   - `7.2` - INSERTs de user_roles  
   - `8.1` - INSERTs de funcionários

## Próximo Deploy

No próximo deploy do CI na VPS:
- O Flyway executará a migration V999
- Os INSERTs hardcoded serão executados
- Todos os usuários e funcionários do `secured_guard_test` estarão no CI! ✅

