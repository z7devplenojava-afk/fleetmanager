-- Migration: V4606__add_missing_columns_to_material_requisitions.sql
-- Description: Adiciona colunas de entrega na tabela material_requisitions (criada na migration V4589)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'material_requisitions') THEN
        ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP;
        ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
        ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivered_by_id UUID;
        ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivered_by_name VARCHAR(255);
        ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS received_by_name VARCHAR(255);
        ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
        ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS origin_department VARCHAR(255);
    END IF;
END $$;
