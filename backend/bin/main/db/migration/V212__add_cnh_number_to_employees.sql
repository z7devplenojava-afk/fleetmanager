-- Migration V504: Add CNH number column to employees table
-- This migration adds a CNH (Carteira Nacional de Habilitação) number field to the employees table

-- Add CNH number column to employees table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'cnh_number'
    ) THEN
        ALTER TABLE employees ADD COLUMN cnh_number VARCHAR(20);
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN employees.cnh_number IS 'Número da Carteira Nacional de Habilitação (CNH) do funcionário';

-- Create index for better performance on CNH number searches
CREATE INDEX IF NOT EXISTS idx_employees_cnh_number ON employees(cnh_number);

-- Add unique constraint to prevent duplicate CNH numbers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_name = 'uk_employees_cnh_number'
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT uk_employees_cnh_number UNIQUE (cnh_number);
    END IF;
END $$;
