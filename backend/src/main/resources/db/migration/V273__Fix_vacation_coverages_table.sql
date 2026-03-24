-- Correção da tabela vacation_coverages
-- Adicionar colunas que podem estar faltando

-- Verificar se a coluna confirmation_date existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'confirmation_date'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN confirmation_date TIMESTAMP;
    END IF;
END $$;

-- Verificar se a coluna confirmed_by existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'confirmed_by'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN confirmed_by UUID;
        ALTER TABLE vacation_coverages ADD CONSTRAINT fk_vacation_coverages_confirmed_by 
            FOREIGN KEY (confirmed_by) REFERENCES users(id);
    END IF;
END $$;

-- Verificar se a coluna is_confirmed existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'is_confirmed'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN is_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Verificar se a coluna vacation_id existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'vacation_id'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN vacation_id UUID;
    END IF;
END $$;

-- Verificar se a coluna substitute_employee_id existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'substitute_employee_id'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN substitute_employee_id UUID;
    END IF;
END $$;

-- Verificar se a coluna coverage_start_date existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'coverage_start_date'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN coverage_start_date DATE;
    END IF;
END $$;

-- Verificar se a coluna coverage_end_date existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'coverage_end_date'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN coverage_end_date DATE;
    END IF;
END $$;

-- Verificar se a coluna location_id existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'location_id'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN location_id UUID;
    END IF;
END $$;

-- Verificar se a coluna shift existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'shift'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN shift VARCHAR(20);
    END IF;
END $$;

-- Verificar se a coluna status existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN status VARCHAR(20);
    END IF;
END $$;

-- Verificar se a coluna observations existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'observations'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN observations TEXT;
    END IF;
END $$;

-- Verificar se a coluna created_at existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Verificar se a coluna updated_at existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_coverages' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE vacation_coverages ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
