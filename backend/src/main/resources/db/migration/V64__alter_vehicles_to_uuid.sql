-- Migração para alterar tabela vehicles e dependências para UUID
-- 1. Adicionar coluna UUID na tabela vehicles
ALTER TABLE vehicles ADD COLUMN id_uuid UUID;

-- 2. Gerar UUIDs para registros existentes
UPDATE vehicles SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- 3. Adicionar coluna vehicle_id_uuid nas tabelas dependentes
ALTER TABLE fuel_records ADD COLUMN vehicle_id_uuid UUID;
ALTER TABLE fines ADD COLUMN vehicle_id_uuid UUID;

-- 4. Preencher as novas colunas com o UUID correspondente
UPDATE fuel_records fr
SET vehicle_id_uuid = v.id_uuid
FROM vehicles v
WHERE fr.vehicle_id = v.id;

UPDATE fines f
SET vehicle_id_uuid = v.id_uuid
FROM vehicles v
WHERE f.vehicle_id = v.id;

-- 5. Remover as foreign keys antigas
ALTER TABLE fuel_records DROP CONSTRAINT fuel_records_vehicle_id_fkey;
ALTER TABLE fines DROP CONSTRAINT fines_vehicle_id_fkey;

-- 6. Remover a PK antiga da tabela vehicles
ALTER TABLE vehicles DROP CONSTRAINT vehicles_pkey;

-- 7. Remover as colunas antigas
ALTER TABLE fuel_records DROP COLUMN vehicle_id;
ALTER TABLE fines DROP COLUMN vehicle_id;
ALTER TABLE vehicles DROP COLUMN id;

-- 8. Renomear as colunas novas
ALTER TABLE vehicles RENAME COLUMN id_uuid TO id;
ALTER TABLE fuel_records RENAME COLUMN vehicle_id_uuid TO vehicle_id;
ALTER TABLE fines RENAME COLUMN vehicle_id_uuid TO vehicle_id;

-- 9. Tornar as colunas NOT NULL
ALTER TABLE vehicles ALTER COLUMN id SET NOT NULL;
ALTER TABLE fuel_records ALTER COLUMN vehicle_id SET NOT NULL;
ALTER TABLE fines ALTER COLUMN vehicle_id SET NOT NULL;

-- 10. Adicionar PK e FKs novas
ALTER TABLE vehicles ADD PRIMARY KEY (id);
ALTER TABLE fuel_records ADD CONSTRAINT fuel_records_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
ALTER TABLE fines ADD CONSTRAINT fines_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

-- 11. Recriar índices
CREATE INDEX IF NOT EXISTS idx_vehicles_id ON vehicles(id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_id ON fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fines_vehicle_id ON fines(vehicle_id); 