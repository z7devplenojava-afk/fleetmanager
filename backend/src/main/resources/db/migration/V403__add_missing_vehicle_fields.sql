-- Adicionar campos faltantes na tabela vehicles
-- Estes campos existem no modelo Vehicle mas não na tabela

-- 1. Adicionar campo initial_mileage
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS initial_mileage INTEGER;

-- 2. Adicionar campo average_consumption
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS average_consumption DECIMAL(10,2);

-- 3. Adicionar campo average_cost_per_km
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS average_cost_per_km DECIMAL(10,2);

-- 4. Adicionar campo assigned_driver
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS assigned_driver VARCHAR(100);

-- 5. Adicionar campo department
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 6. Adicionar campo location
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS location VARCHAR(200);

-- 7. Adicionar campo acquisition_date
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS acquisition_date DATE;

-- 8. Adicionar campo acquisition_value
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS acquisition_value DECIMAL(10,2);

-- 9. Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_vehicles_initial_mileage ON vehicles(initial_mileage);
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver ON vehicles(assigned_driver);
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_acquisition_date ON vehicles(acquisition_date);

-- 10. Atualizar registros existentes com valores padrão
UPDATE vehicles 
SET 
    initial_mileage = current_mileage,
    average_consumption = 0.00,
    average_cost_per_km = 0.00,
    assigned_driver = 'Não atribuído',
    department = 'Frota',
    location = 'Garagem Principal',
    acquisition_date = created_at,
    acquisition_value = 0.00
WHERE initial_mileage IS NULL;

-- 11. Comentários sobre os novos campos
COMMENT ON COLUMN vehicles.initial_mileage IS 'Quilometragem inicial do veículo';
COMMENT ON COLUMN vehicles.average_consumption IS 'Consumo médio de combustível (L/100km)';
COMMENT ON COLUMN vehicles.average_cost_per_km IS 'Custo médio por quilômetro';
COMMENT ON COLUMN vehicles.assigned_driver IS 'Motorista responsável pelo veículo';
COMMENT ON COLUMN vehicles.department IS 'Departamento responsável pelo veículo';
COMMENT ON COLUMN vehicles.location IS 'Localização atual do veículo';
COMMENT ON COLUMN vehicles.acquisition_date IS 'Data de aquisição do veículo';
COMMENT ON COLUMN vehicles.acquisition_value IS 'Valor de aquisição do veículo';
