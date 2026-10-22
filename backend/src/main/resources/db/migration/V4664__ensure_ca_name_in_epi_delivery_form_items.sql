-- Garantir que a coluna ca_name exista na tabela epi_delivery_form_items
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'epi_delivery_form_items'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'epi_delivery_form_items' 
            AND column_name = 'ca_name'
        ) THEN
            ALTER TABLE epi_delivery_form_items ADD COLUMN ca_name VARCHAR(255);
        END IF;
    END IF;
END $$;
