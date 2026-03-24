-- Ajustes completos na tabela routes para alinhar com a entidade Route
ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS estimated_duration INTERVAL,
    ADD COLUMN IF NOT EXISTS checkpoints_required BOOLEAN NOT NULL DEFAULT FALSE;

-- Ajuste do tipo de description para VARCHAR(500) se necessário
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routes' AND column_name = 'description' AND data_type = 'text'
    ) THEN
        ALTER TABLE routes ALTER COLUMN description TYPE VARCHAR(500);
    END IF;
END $$; 