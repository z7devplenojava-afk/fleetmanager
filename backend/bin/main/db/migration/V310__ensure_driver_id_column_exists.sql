-- Garantir que a coluna driver_id existe na tabela fuel_records
-- Esta migration é idempotente (pode ser executada múltiplas vezes sem erro)

DO $$ 
BEGIN
    -- Verificar se a coluna driver_id já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'driver_id'
    ) THEN
        -- Adicionar a coluna driver_id
        ALTER TABLE fuel_records ADD COLUMN driver_id UUID;
        
        -- Adicionar constraint de chave estrangeira se a tabela drivers existir
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'drivers'
        ) THEN
            ALTER TABLE fuel_records 
            ADD CONSTRAINT fk_fuelrecord_driver 
            FOREIGN KEY (driver_id) REFERENCES drivers(id) 
            ON DELETE SET NULL;
        END IF;
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_fuel_records_driver_id 
        ON fuel_records(driver_id);
        
        -- Adicionar comentário
        COMMENT ON COLUMN fuel_records.driver_id IS 'Referência ao motorista responsável pelo abastecimento';
        
        RAISE NOTICE 'Coluna driver_id adicionada à tabela fuel_records';
    ELSE
        RAISE NOTICE 'Coluna driver_id já existe na tabela fuel_records';
    END IF;
END $$;

