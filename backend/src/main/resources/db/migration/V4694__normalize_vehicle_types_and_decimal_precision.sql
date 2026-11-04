-- Normalizacao de tipos de veiculos legados no banco de dados para evitar erro de enum
UPDATE vehicles 
SET vehicle_type = 'MINIBUS' 
WHERE vehicle_type IN ('MICROBUS', 'MICRO_ONIBUS');

UPDATE vehicles 
SET vehicle_type = 'BUS_ROAD' 
WHERE vehicle_type IN ('RODOVIARIO', 'BUS_INTERCITY_ROAD');

-- Garantir precisao decimal 15,9 para valores unitarios e totais de itens de faturamento e medicao
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_invoice_items') THEN
        ALTER TABLE rental_invoice_items ALTER COLUMN unit_rate TYPE NUMERIC(15,9);
        ALTER TABLE rental_invoice_items ALTER COLUMN total_amount TYPE NUMERIC(15,9);
    END IF;

    -- Em measurement_items, a coluna total_value pode ser gerada (GENERATED ALWAYS AS (quantity * unit_price) STORED).
    -- O PostgreSQL exige remover a coluna gerada antes de alterar o tipo de unit_price.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' AND column_name = 'total_value' AND is_generated = 'ALWAYS'
    ) THEN
        ALTER TABLE measurement_items DROP COLUMN total_value;
        ALTER TABLE measurement_items ALTER COLUMN unit_price TYPE NUMERIC(15,9);
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'measurement_items' AND column_name = 'total_price') THEN
            ALTER TABLE measurement_items ALTER COLUMN total_price TYPE NUMERIC(15,9);
        END IF;
        ALTER TABLE measurement_items ADD COLUMN total_value NUMERIC(15,9) GENERATED ALWAYS AS (quantity * unit_price) STORED;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'measurement_items') THEN
        ALTER TABLE measurement_items ALTER COLUMN unit_price TYPE NUMERIC(15,9);
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'measurement_items' AND column_name = 'total_price') THEN
            ALTER TABLE measurement_items ALTER COLUMN total_price TYPE NUMERIC(15,9);
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Ajuste de precisao decimal ignorado com seguranca: %', SQLERRM;
END $$;
