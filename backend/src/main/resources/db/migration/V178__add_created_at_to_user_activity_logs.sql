-- Adicionar coluna created_at à tabela user_activity_logs se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
