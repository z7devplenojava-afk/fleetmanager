-- Garantir colunas de timestamp e trigger em measurement_items
-- V1020__ensure_measurement_items_timestamps.sql

-- Adicionar created_at (NOT NULL) se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE measurement_items 
            ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Adicionar updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE measurement_items 
            ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_measurement_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir trigger de atualização de updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_measurement_items_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_measurement_items_updated_at
            BEFORE UPDATE ON measurement_items
            FOR EACH ROW
            EXECUTE FUNCTION update_measurement_tables_updated_at();
    END IF;
END $$;


