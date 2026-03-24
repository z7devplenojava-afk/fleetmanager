-- SCRIPT FINAL - Adiciona TODAS as colunas e relações faltantes
-- Data: 2025-10-17
-- Execute no DBeaver no banco secured_guard_test

-- 1. Adicionar coluna company_id (RELAÇÃO)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID;

-- 2. Adicionar coluna cnh_category e cnh_expiration_date (caso não tenham sido criadas)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_expiration_date DATE;

-- 3. Adicionar coluna gender e rg (caso não tenham sido criadas)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(1);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rg VARCHAR(20);

-- 4. Adicionar constraint de foreign key para company_id
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

-- 6. Adicionar comentário
COMMENT ON COLUMN employees.company_id IS 'ID da empresa à qual o funcionário está vinculado';

-- 7. Verificar se company_id foi criada
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name IN ('company_id', 'cnh_category', 'cnh_expiration_date', 'gender', 'rg')
ORDER BY column_name;

