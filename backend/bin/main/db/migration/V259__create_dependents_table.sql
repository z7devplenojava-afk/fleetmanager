-- Migration: V259__create_dependents_table.sql
-- Descrição: Criar tabela de dependentes com relacionamento obrigatório para funcionários

-- Criar tabela dependents
CREATE TABLE IF NOT EXISTS dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    cpf VARCHAR(14),
    rg VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar colunas que podem não existir
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS gender VARCHAR(1);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS is_student BOOLEAN;
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS school_name VARCHAR(100);
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS is_beneficiary BOOLEAN;
ALTER TABLE dependents ADD COLUMN IF NOT EXISTS notes VARCHAR(500);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_dependents_employee_id ON dependents(employee_id);
CREATE INDEX IF NOT EXISTS idx_dependents_cpf ON dependents(cpf);
CREATE INDEX IF NOT EXISTS idx_dependents_relationship ON dependents(relationship);
CREATE INDEX IF NOT EXISTS idx_dependents_birth_date ON dependents(birth_date);

-- Adicionar chave estrangeira (sem IF NOT EXISTS pois PostgreSQL não suporta)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_dependents_employee_id' 
        AND table_name = 'dependents'
    ) THEN
        ALTER TABLE dependents 
        ADD CONSTRAINT fk_dependents_employee_id 
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
    END IF;
END $$;
