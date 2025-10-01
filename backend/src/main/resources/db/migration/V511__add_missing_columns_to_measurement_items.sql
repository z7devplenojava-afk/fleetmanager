-- Migração para adicionar colunas faltantes na tabela measurement_items
-- V1007__add_missing_columns_to_measurement_items.sql

-- Adicionar coluna created_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION update_measurement_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_measurement_items_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_measurement_items_updated_at
            BEFORE UPDATE ON measurement_items
            FOR EACH ROW
            EXECUTE FUNCTION update_measurement_tables_updated_at();
    END IF;
END $$;
