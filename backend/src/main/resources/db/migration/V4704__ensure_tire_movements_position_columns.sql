-- Garante as colunas axle_number e position_index em tire_movements.
-- Motivo: V420__add_position_to_tire_movements.sql reutilizou a versao V420 (antes usada por V420__create_visits_table.sql),
-- fazendo o Flyway pular a adicao dessas colunas em bancos ja inicializados antes da refatoracao.

ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS axle_number INTEGER;
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS position_index INTEGER;
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS position VARCHAR(50);

-- Garante tambem as colunas correspondentes em tires por seguranca
ALTER TABLE tires ADD COLUMN IF NOT EXISTS axle_number INTEGER;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS position_index INTEGER;

