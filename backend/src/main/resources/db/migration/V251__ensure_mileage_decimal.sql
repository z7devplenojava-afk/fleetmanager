-- Migration V251: Garantir que a coluna mileage seja DECIMAL(15,9)
-- Esta migração garante que a coluna mileage tenha o tipo correto DECIMAL(15,9)

-- Verificar se a coluna mileage existe e tem o tipo correto
DO $$
BEGIN
    -- Se a coluna mileage não existe ou não é DECIMAL(15,9), recriar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_maintenances' 
        AND column_name = 'mileage' 
        AND data_type = 'numeric' 
        AND numeric_precision = 15 
        AND numeric_scale = 9
    ) THEN
        -- Se a coluna existe mas tem tipo incorreto, alterar
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vehicle_maintenances' 
            AND column_name = 'mileage'
        ) THEN
            -- Alterar o tipo da coluna existente
            ALTER TABLE vehicle_maintenances ALTER COLUMN mileage TYPE DECIMAL(15,9);
        ELSE
            -- Se a coluna não existe, criar
            ALTER TABLE vehicle_maintenances ADD COLUMN mileage DECIMAL(15,9);
        END IF;
        
        -- Adicionar comentário
        COMMENT ON COLUMN vehicle_maintenances.mileage IS 'Quilometragem com até 9 casas decimais (ex: 125.125)';
    END IF;
END $$;
