# Como Executar a Migration V338 (unification_jobs)

A tabela `unification_jobs` não foi criada automaticamente. Siga um dos métodos abaixo para executar a migration manualmente.

## 📋 Opções para Executar a Migration

### **Opção 1: Via Script SQL (Recomendado - Mais Rápido)**

#### No Windows:
1. Abra o **pgAdmin** ou **psql** (linha de comando do PostgreSQL)
2. Conecte-se ao banco de dados `secured_guard`
3. Execute o arquivo SQL:
   ```sql
   \i backend/src/main/resources/db/migration/V338__create_unification_jobs_table.sql
   ```
   
   Ou copie e cole o conteúdo do arquivo `backend/src/main/resources/db/migration/V338__create_unification_jobs_table.sql` diretamente no console SQL.

#### No Linux/Mac:
```bash
psql -h localhost -p 5432 -U postgres -d secured_guard -f backend/src/main/resources/db/migration/V338__create_unification_jobs_table.sql
```

### **Opção 2: Via Script Automatizado**

#### Windows:
1. Abra o PowerShell ou CMD
2. Navegue até a pasta do projeto:
   ```cmd
   cd C:\dev\secured-guard
   ```
3. Execute o script:
   ```cmd
   executar-migration-v338.bat
   ```

#### Linux/Mac:
1. Dê permissão de execução:
   ```bash
   chmod +x executar-migration-v338.sh
   ```
2. Execute o script:
   ```bash
   ./executar-migration-v338.sh
   ```

**Nota:** Ajuste as variáveis de ambiente no script se necessário:
- `DB_HOST` (padrão: localhost)
- `DB_PORT` (padrão: 5432)
- `DB_NAME` (padrão: secured_guard)
- `DB_USER` (padrão: postgres)
- `DB_PASSWORD` (ajuste conforme seu ambiente)

### **Opção 3: Via Maven Flyway Plugin**

1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```

2. Execute a migration via Maven:
   ```bash
   mvn flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/secured_guard -Dflyway.user=postgres -Dflyway.password=SUA_SENHA
   ```

   **Para ambiente CI:**
   ```bash
   mvn flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/secured_guard -Dflyway.user=postgres -Dflyway.password=4KaCiJc6an@7sgbdcid2025
   ```

### **Opção 4: Executar SQL Diretamente no Banco**

1. Conecte-se ao banco de dados PostgreSQL
2. Execute o seguinte SQL:

```sql
-- Verificar se a tabela já existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'unification_jobs'
);

-- Se não existir, criar a tabela
CREATE TABLE IF NOT EXISTS unification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL,
    month INTEGER,
    year INTEGER,
    force_unification BOOLEAN DEFAULT FALSE,
    total_documents INTEGER NOT NULL DEFAULT 0,
    processed_documents INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    error_message VARCHAR(2000),
    processing_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_unification_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_unification_jobs_status ON unification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_at ON unification_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_by ON unification_jobs(created_by);

-- Registrar no histórico do Flyway (opcional, mas recomendado)
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
SELECT 
    COALESCE(MAX(installed_rank), 0) + 1,
    '338',
    'create unification jobs table',
    'SQL',
    'V338__create_unification_jobs_table.sql',
    0,
    current_user,
    CURRENT_TIMESTAMP,
    0,
    true
FROM flyway_schema_history
WHERE NOT EXISTS (
    SELECT 1 FROM flyway_schema_history WHERE version = '338'
);
```

## ✅ Verificar se a Migration Foi Executada

Após executar a migration, verifique se a tabela foi criada:

```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'unification_jobs';

-- Ver a estrutura da tabela
\d unification_jobs

-- Verificar no histórico do Flyway
SELECT * FROM flyway_schema_history WHERE version = '338';
```

## 🔧 Para Ambiente CI (VPS)

Se você estiver no ambiente CI, execute via SSH:

```bash
ssh usuario@vps-host

# Conectar ao container do PostgreSQL
docker exec -it postgres-ci psql -U postgres -d secured_guard

# Ou executar o SQL diretamente
docker exec -i postgres-ci psql -U postgres -d secured_guard < backend/src/main/resources/db/migration/V338__create_unification_jobs_table.sql
```

## ⚠️ Importante

- **Backup:** Sempre faça backup do banco antes de executar migrations em produção
- **Histórico Flyway:** Se você executar a migration manualmente, é recomendado registrar no `flyway_schema_history` para evitar conflitos futuros
- **Permissões:** Certifique-se de ter permissões adequadas no banco de dados

## 🐛 Solução de Problemas

### Erro: "relation already exists"
A tabela já existe. Verifique com:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'unification_jobs';
```

### Erro: "permission denied"
Verifique as permissões do usuário do banco:
```sql
GRANT ALL PRIVILEGES ON DATABASE secured_guard TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
```

### Erro: "foreign key constraint"
Certifique-se de que a tabela `users` existe:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'users';
```

