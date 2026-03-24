-- Criação da tabela de registros de quilometragem
CREATE TABLE IF NOT EXISTS mileage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    date DATE NOT NULL,
    initial_mileage INTEGER NOT NULL,
    final_mileage INTEGER NOT NULL,
    distance_traveled INTEGER NOT NULL,
    fuel_consumed DECIMAL(10,2) NOT NULL,
    fuel_cost DECIMAL(10,2) NOT NULL,
    cost_per_km DECIMAL(10,2) NOT NULL,
    average_consumption DECIMAL(10,2) NOT NULL,
    trip_type VARCHAR(20) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    driver VARCHAR(100),
    destination VARCHAR(200),
    purpose VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_mileage_records_vehicle_id ON mileage_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mileage_records_date ON mileage_records(date);
CREATE INDEX IF NOT EXISTS idx_mileage_records_vehicle_date ON mileage_records(vehicle_id, date);
CREATE INDEX IF NOT EXISTS idx_mileage_records_driver ON mileage_records(driver);
CREATE INDEX IF NOT EXISTS idx_mileage_records_trip_type ON mileage_records(trip_type);
CREATE INDEX IF NOT EXISTS idx_mileage_records_fuel_type ON mileage_records(fuel_type);
CREATE INDEX IF NOT EXISTS idx_mileage_records_destination ON mileage_records(destination);
CREATE INDEX IF NOT EXISTS idx_mileage_records_purpose ON mileage_records(purpose);
CREATE INDEX IF NOT EXISTS idx_mileage_records_average_consumption ON mileage_records(average_consumption);
CREATE INDEX IF NOT EXISTS idx_mileage_records_cost_per_km ON mileage_records(cost_per_km);

-- Índice único para evitar registros duplicados na mesma data para o mesmo veículo
CREATE UNIQUE INDEX IF NOT EXISTS idx_mileage_records_vehicle_date_unique ON mileage_records(vehicle_id, date); 