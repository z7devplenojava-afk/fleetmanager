-- Migration simplificada para corrigir tabelas operacionais
-- Apenas adicionar colunas que podem estar faltando

-- Verificar e adicionar colunas na tabela specific_activities
DO $$ 
BEGIN
    -- Adicionar coluna scheduled_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'scheduled_date'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN scheduled_date DATE;
    END IF;
    
    -- Adicionar coluna activity_type se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'activity_type'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN activity_type VARCHAR(50);
    END IF;
    
    -- Adicionar coluna description se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN description TEXT;
    END IF;
    
    -- Adicionar coluna start_time se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN start_time TIME;
    END IF;
    
    -- Adicionar coluna end_time se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN end_time TIME;
    END IF;
    
    -- Adicionar coluna location se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN location VARCHAR(255);
    END IF;
    
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN status VARCHAR(20) DEFAULT 'SCHEDULED';
    END IF;
    
    -- Adicionar coluna priority se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL';
    END IF;
    
    -- Adicionar coluna observations se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'observations'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN observations TEXT;
    END IF;
    
    -- Adicionar coluna assigned_by se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'assigned_by'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN assigned_by UUID;
    END IF;
    
    -- Adicionar coluna completed_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specific_activities' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE specific_activities ADD COLUMN completed_at TIMESTAMP;
    END IF;
END $$;

-- Verificar e adicionar colunas na tabela work_post_assignments
DO $$ 
BEGIN
    -- Adicionar coluna assignment_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'assignment_date'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN assignment_date DATE;
    END IF;
    
    -- Adicionar coluna shift se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'shift'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN shift VARCHAR(20);
    END IF;
    
    -- Adicionar coluna start_time se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN start_time TIME;
    END IF;
    
    -- Adicionar coluna end_time se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN end_time TIME;
    END IF;
    
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN status VARCHAR(20) DEFAULT 'SCHEDULED';
    END IF;
    
    -- Adicionar coluna observations se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'observations'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN observations TEXT;
    END IF;
    
    -- Adicionar coluna assigned_by se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'assigned_by'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN assigned_by UUID;
    END IF;
    
    -- Adicionar coluna confirmed_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN confirmed_at TIMESTAMP;
    END IF;
    
    -- Adicionar coluna completed_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_post_assignments' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE work_post_assignments ADD COLUMN completed_at TIMESTAMP;
    END IF;
END $$;
