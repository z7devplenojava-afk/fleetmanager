-- Add stack_trace column to error_logs if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'error_logs' 
          AND column_name = 'stack_trace'
    ) THEN
        ALTER TABLE error_logs ADD COLUMN stack_trace TEXT;
    END IF;
END $$; 