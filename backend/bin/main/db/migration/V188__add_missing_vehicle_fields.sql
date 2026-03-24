-- Adicionar campos que estavam faltando na tabela vehicles
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS initial_mileage INTEGER,
ADD COLUMN IF NOT EXISTS assigned_driver VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS acquisition_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS average_consumption DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS average_cost_per_km DECIMAL(10,2);

-- Comentários para documentar os campos
COMMENT ON COLUMN vehicles.initial_mileage IS 'Quilometragem inicial do veículo';
COMMENT ON COLUMN vehicles.assigned_driver IS 'Motorista designado para o veículo';
COMMENT ON COLUMN vehicles.department IS 'Departamento responsável pelo veículo';
COMMENT ON COLUMN vehicles.location IS 'Localização atual do veículo';
COMMENT ON COLUMN vehicles.acquisition_date IS 'Data de aquisição do veículo';
COMMENT ON COLUMN vehicles.acquisition_value IS 'Valor de aquisição do veículo';
COMMENT ON COLUMN vehicles.average_consumption IS 'Consumo médio de combustível (L/km)';
COMMENT ON COLUMN vehicles.average_cost_per_km IS 'Custo médio por quilômetro';
