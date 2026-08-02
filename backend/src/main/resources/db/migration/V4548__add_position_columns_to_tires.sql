-- Garante colunas de posicionamento na tabela tires
ALTER TABLE tires ADD COLUMN IF NOT EXISTS axle_number INT;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS position_index INT;
