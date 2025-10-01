-- Dropar tabelas existentes se existirem (em ordem reversa devido às foreign keys)
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS fuel_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Criar tabela vehicles com UUID
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate VARCHAR(10) NOT NULL UNIQUE,
    model VARCHAR(50) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    fuel_type VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL,
    current_mileage INTEGER NOT NULL DEFAULT 0,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    insurance_expiry_date DATE,
    documentation_expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para vehicles
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_brand_model ON vehicles(brand, model);

-- Criar tabela fuel_records com UUID
CREATE TABLE fuel_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    date DATE NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    mileage INTEGER NOT NULL,
    station VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Criar índices para fuel_records
CREATE INDEX idx_fuel_records_vehicle_id ON fuel_records(vehicle_id);
CREATE INDEX idx_fuel_records_date ON fuel_records(date);
CREATE INDEX idx_fuel_records_vehicle_date ON fuel_records(vehicle_id, date);

-- Criar tabela fines com UUID
CREATE TABLE fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    location VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Criar índices para fines
CREATE INDEX idx_fines_vehicle_id ON fines(vehicle_id);
CREATE INDEX idx_fines_date ON fines(date);
CREATE INDEX idx_fines_status ON fines(status);
CREATE INDEX idx_fines_due_date ON fines(due_date);
CREATE INDEX idx_fines_vehicle_status ON fines(vehicle_id, status); 