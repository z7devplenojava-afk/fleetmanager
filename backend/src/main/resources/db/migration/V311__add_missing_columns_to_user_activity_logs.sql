-- Adicionar colunas que estão faltando na tabela user_activity_logs
DO $$
BEGIN
    -- Adicionar coluna ended_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'ended_at'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN ended_at TIMESTAMP;
    END IF;

    -- Adicionar coluna execution_time_ms se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'execution_time_ms'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN execution_time_ms BIGINT;
    END IF;

    -- Adicionar coluna ip_address se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN ip_address VARCHAR(45);
    END IF;

    -- Adicionar coluna module se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'module'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN module VARCHAR(50);
    END IF;

    -- Adicionar coluna session_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'session_id'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN session_id VARCHAR(100);
    END IF;

    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN status VARCHAR(20);
    END IF;

    -- Adicionar coluna user_agent se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN user_agent VARCHAR(500);
    END IF;

END $$;
