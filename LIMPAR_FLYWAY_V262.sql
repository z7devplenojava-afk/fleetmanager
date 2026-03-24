-- Limpar registro da migration V262 do Flyway para permitir re-execução
-- Data: 2025-10-17

-- 1. Verificar se V262 está registrada
SELECT installed_rank, version, description, installed_on, success
FROM flyway_schema_history
WHERE version = '262';

-- 2. Deletar o registro da V262 (para permitir re-execução)
DELETE FROM flyway_schema_history
WHERE version = '262';

-- 3. Adicionar a coluna company_id AGORA (não esperar Flyway)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID;

-- 4. Adicionar constraint de foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_employee_company'
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT fk_employee_company 
        FOREIGN KEY (company_id) 
        REFERENCES companies(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Adicionar índice
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);

-- 6. Verificar se company_id foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'company_id';

