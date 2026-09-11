-- Migration V4567: Adiciona campos adicionais de gestão de frota na tabela vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS patrimony_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model_year INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS hourmeter INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS project_name VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operation_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operation_name VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS garage_name VARCHAR(200);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operation_entry_date DATE;
