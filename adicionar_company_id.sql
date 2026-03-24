-- Adicionar coluna company_id na tabela employees
-- Data: 2025-10-17

ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID;

-- Adicionar constraint de foreign key se não existir
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

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);

-- Adicionar comentário
COMMENT ON COLUMN employees.company_id IS 'ID da empresa à qual o funcionário está vinculado';

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'company_id';

