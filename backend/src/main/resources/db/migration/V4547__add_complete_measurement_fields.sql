-- Migração para adicionar campos completos à tabela measurement_items
-- V4547__add_complete_measurement_fields.sql
-- Campos adicionados: diária, KM considerado, KM excedido, valor KM excedido,
-- e dados da viagem extra (data, trajeto, tipo de veículo)

-- Diária (valor por dia)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'diaria'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN diaria DECIMAL(15,2) DEFAULT 0.00;
    END IF;
END $$;

-- KM considerado (diferença entre KM final e KM inicial)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'km_considerado'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN km_considerado DECIMAL(10,2);
    END IF;
END $$;

-- KM excedido (KM considerado acima da franquia e do desconsiderado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'km_excedido'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN km_excedido DECIMAL(10,2);
    END IF;
END $$;

-- Valor do KM excedido (KM excedido x preço unitário)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'valor_km_excedido'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN valor_km_excedido DECIMAL(15,2) DEFAULT 0.00;
    END IF;
END $$;

-- Data da viagem extra
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'trip_date'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN trip_date DATE;
    END IF;
END $$;

-- Trajeto da viagem extra (origem/destino ou rota)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'route'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN route VARCHAR(255);
    END IF;
END $$;

-- Tipo de veículo da viagem extra
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurement_items' 
        AND column_name = 'vehicle_type'
    ) THEN
        ALTER TABLE measurement_items 
        ADD COLUMN vehicle_type VARCHAR(100);
    END IF;
END $$;
