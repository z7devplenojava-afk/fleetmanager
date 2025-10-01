-- Criação da tabela de manutenções de veículos
CREATE TABLE IF NOT EXISTS vehicle_maintenances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    date DATE NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2),
    provider VARCHAR(200),
    mileage INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_vehicle_id ON vehicle_maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_date ON vehicle_maintenances(date);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_status ON vehicle_maintenances(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_priority ON vehicle_maintenances(priority);
