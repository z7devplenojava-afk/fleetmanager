-- Garantir que todas as colunas necessárias existem na tabela fuel_records
-- Esta migration é idempotente (pode ser executada múltiplas vezes sem erro)

DO $$ 
BEGIN
    -- Adicionar coluna driver_id se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'driver_id'
    ) THEN
        ALTER TABLE fuel_records ADD COLUMN driver_id UUID;
        RAISE NOTICE 'Coluna driver_id adicionada';
    END IF;

    -- Adicionar coluna initial_mileage se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'initial_mileage'
    ) THEN
        ALTER TABLE fuel_records ADD COLUMN initial_mileage INTEGER;
        RAISE NOTICE 'Coluna initial_mileage adicionada';
    END IF;

    -- Adicionar coluna final_mileage se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'final_mileage'
    ) THEN
        ALTER TABLE fuel_records ADD COLUMN final_mileage INTEGER;
        RAISE NOTICE 'Coluna final_mileage adicionada';
    END IF;

    -- Adicionar coluna cost_center se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'cost_center'
    ) THEN
        ALTER TABLE fuel_records ADD COLUMN cost_center VARCHAR(255);
        RAISE NOTICE 'Coluna cost_center adicionada';
    END IF;

    -- Adicionar coluna notes se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE fuel_records ADD COLUMN notes TEXT;
        RAISE NOTICE 'Coluna notes adicionada';
    END IF;

    -- Adicionar coluna receipt_url se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'receipt_url'
    ) THEN
        ALTER TABLE fuel_records ADD COLUMN receipt_url VARCHAR(500);
        RAISE NOTICE 'Coluna receipt_url adicionada';
    END IF;

    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fuel_records' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE fuel_records ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna created_at adicionada';
    END IF;

    -- Adicionar constraint de chave estrangeira para driver_id se não existir
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_fuelrecord_driver'
        AND table_name = 'fuel_records'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'drivers'
    ) THEN
        ALTER TABLE fuel_records 
        ADD CONSTRAINT fk_fuelrecord_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Foreign key fk_fuelrecord_driver adicionada';
    END IF;

    -- Criar índices se não existirem
    CREATE INDEX IF NOT EXISTS idx_fuel_records_driver_id ON fuel_records(driver_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);
    CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_date ON fuel_records(vehicle_id, date);
    
    -- Adicionar comentários
    COMMENT ON COLUMN fuel_records.driver_id IS 'Referência ao motorista responsável pelo abastecimento';
    COMMENT ON COLUMN fuel_records.initial_mileage IS 'Quilometragem inicial do veículo no momento do abastecimento';
    COMMENT ON COLUMN fuel_records.final_mileage IS 'Quilometragem final do veículo após o abastecimento';
    COMMENT ON COLUMN fuel_records.cost_center IS 'Centro de custo associado ao abastecimento';
    COMMENT ON COLUMN fuel_records.notes IS 'Observações sobre o abastecimento';
    COMMENT ON COLUMN fuel_records.receipt_url IS 'URL do comprovante de abastecimento';
    
    RAISE NOTICE '✅ Migration V311 concluída - Todas as colunas de fuel_records verificadas';
END $$;

