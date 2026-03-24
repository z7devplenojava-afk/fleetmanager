-- Add endpoint column to error_logs if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'error_logs' 
          AND column_name = 'endpoint'
    ) THEN
        ALTER TABLE error_logs ADD COLUMN endpoint VARCHAR(255);
    END IF;
END $$; 