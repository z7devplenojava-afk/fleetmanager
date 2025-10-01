-- Adicionar novos campos para controle de km na tabela vehicles
ALTER TABLE vehicles 
ADD COLUMN initial_mileage INTEGER,
ADD COLUMN average_consumption DECIMAL(10,2),
ADD COLUMN average_cost_per_km DECIMAL(10,2),
ADD COLUMN assigned_driver VARCHAR(100),
ADD COLUMN department VARCHAR(100),
ADD COLUMN location VARCHAR(200),
ADD COLUMN notes TEXT;

-- Índices para os novos campos
CREATE INDEX idx_vehicles_assigned_driver ON vehicles(assigned_driver);
CREATE INDEX idx_vehicles_department ON vehicles(department);
CREATE INDEX idx_vehicles_location ON vehicles(location);
CREATE INDEX idx_vehicles_average_consumption ON vehicles(average_consumption);
CREATE INDEX idx_vehicles_average_cost_per_km ON vehicles(average_cost_per_km); 