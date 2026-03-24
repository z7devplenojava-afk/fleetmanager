-- Migração para adicionar campos de frota e faturamento à medição
-- V241__add_fleet_and_billing_fields_to_measurement.sql

-- Adicionar tipo de medição ao boletim
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_bulletins' 
        AND column_name = 'measurement_type'
    ) THEN
        ALTER TABLE measurement_bulletins 
        ADD COLUMN measurement_type VARCHAR(20) DEFAULT 'GLOBAL';
    END IF;
END $$;

-- Adicionar campos de frota aos itens de medição
DO $$
BEGIN
    -- Placa do veículo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'vehicle_plate'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN vehicle_plate VARCHAR(20);
    END IF;

    -- Quantidade de viagens
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'trip_count'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN trip_count INTEGER DEFAULT 0;
    END IF;

    -- Flag de viagem extra
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'is_extra_trip'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN is_extra_trip BOOLEAN DEFAULT FALSE;
    END IF;

    -- Valor base (para cálculos proporcionais)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'base_value'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN base_value DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Dias trabalhados
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'working_days'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN working_days INTEGER DEFAULT 0;
    END IF;
END $$;
