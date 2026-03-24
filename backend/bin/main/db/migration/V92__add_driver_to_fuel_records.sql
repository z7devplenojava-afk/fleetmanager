-- Adicionar campo motorista à tabela fuel_records
ALTER TABLE fuel_records ADD COLUMN driver VARCHAR(255);

-- Criar índice para melhorar performance de consultas por motorista
CREATE INDEX idx_fuel_records_driver ON fuel_records (driver);

-- Criar índice composto para consultas por veículo e motorista
CREATE INDEX idx_fuel_records_vehicle_driver ON fuel_records (vehicle_id, driver);

-- Comentário na tabela
COMMENT ON COLUMN fuel_records.driver IS 'Nome do motorista responsável pelo abastecimento'; 