-- Adicionar colunas faltantes à tabela vehicles
-- Baseado na entidade Vehicle.java

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS initial_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS assigned_driver VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS responsible_employee_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS acquisition_value DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS average_consumption DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS average_cost_per_km DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photos TEXT;

-- Comentários
COMMENT ON COLUMN vehicles.photos IS 'URLs das fotos do veículo (separadas por vírgula)';
COMMENT ON COLUMN vehicles.responsible_employee_id IS 'ID do funcionário responsável pelo veículo';
COMMENT ON COLUMN vehicles.acquisition_value IS 'Valor de aquisição do veículo';
COMMENT ON COLUMN vehicles.average_consumption IS 'Consumo médio (km/l)';
COMMENT ON COLUMN vehicles.average_cost_per_km IS 'Custo médio por quilômetro';

