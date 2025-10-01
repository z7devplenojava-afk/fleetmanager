-- Ajuste do tipo da coluna estimated_duration para BIGINT (compatível com Duration do Java)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routes' AND column_name = 'estimated_duration' AND data_type = 'interval'
    ) THEN
        ALTER TABLE routes ALTER COLUMN estimated_duration TYPE BIGINT USING EXTRACT(EPOCH FROM estimated_duration) * 1000;
    END IF;
END $$; 