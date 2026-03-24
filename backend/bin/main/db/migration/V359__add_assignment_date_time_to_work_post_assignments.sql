-- Adiciona colunas faltantes na tabela work_post_assignments

DO $$ 
BEGIN
    -- Adicionar coluna assignment_date_time se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'assignment_date_time'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN assignment_date_time TIMESTAMP;
    END IF;
    
    -- Adicionar coluna is_primary_assignment se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'is_primary_assignment'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN is_primary_assignment BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Adicionar coluna is_backup_assignment se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'is_backup_assignment'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN is_backup_assignment BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Adicionar coluna special_instructions se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN special_instructions TEXT;
    END IF;
    
    -- Renomear coluna shift para shift_type se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'shift'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'shift_type'
    ) THEN
        ALTER TABLE work_post_assignments RENAME COLUMN shift TO shift_type;
    END IF;
    
    -- Se shift_type não existe e shift também não existe, criar shift_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'shift_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'shift'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN shift_type VARCHAR(20) NOT NULL DEFAULT 'DAY';
    END IF;
END $$;

