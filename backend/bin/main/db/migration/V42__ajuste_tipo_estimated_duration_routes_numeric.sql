-- Ajuste do tipo da coluna estimated_duration para NUMERIC(21,0)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routes' AND column_name = 'estimated_duration' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE routes ALTER COLUMN estimated_duration TYPE NUMERIC(21,0) USING estimated_duration::NUMERIC(21,0);
    END IF;
END $$; 