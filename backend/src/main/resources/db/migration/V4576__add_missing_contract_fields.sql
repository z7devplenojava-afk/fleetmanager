-- ============================================================
-- V4576: Adicionar colunas faltantes na tabela contracts (obra_name, etc.)
-- ============================================================

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS obra_name VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vehicle_quantity INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS unit_vehicle_value NUMERIC(15, 2);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vehicle_description VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vigencia_text TEXT;
