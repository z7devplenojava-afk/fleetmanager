-- Migration V250: Adicionar colunas à tabela units (com verificação de existência)
-- V250__add_columns_to_units.sql

-- Adicionar coluna code se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'units' AND column_name = 'code') THEN
        ALTER TABLE units ADD COLUMN code VARCHAR(50);
    END IF;
END $$;

-- Adicionar coluna manager se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'units' AND column_name = 'manager') THEN
        ALTER TABLE units ADD COLUMN manager VARCHAR(100);
    END IF;
END $$;

-- Adicionar coluna active se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'units' AND column_name = 'active') THEN
        ALTER TABLE units ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$; 