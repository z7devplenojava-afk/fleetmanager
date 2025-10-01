-- Criação da tabela de manutenções de veículos
-- Migration V243 - Criar tabela vehicle_maintenances completa

CREATE TABLE vehicle_maintenances (
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
    photos TEXT, -- Lista de URLs das fotos (JSON array)
    documents TEXT, -- Lista de URLs dos documentos (JSON array)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_vehicle_maintenances_vehicle_id ON vehicle_maintenances(vehicle_id);
CREATE INDEX idx_vehicle_maintenances_date ON vehicle_maintenances(date);
CREATE INDEX idx_vehicle_maintenances_status ON vehicle_maintenances(status);
CREATE INDEX idx_vehicle_maintenances_priority ON vehicle_maintenances(priority);

-- Comentários para documentação
COMMENT ON TABLE vehicle_maintenances IS 'Tabela de manutenções de veículos';
COMMENT ON COLUMN vehicle_maintenances.photos IS 'Lista de URLs das fotos da manutenção (JSON array)';
COMMENT ON COLUMN vehicle_maintenances.documents IS 'Lista de URLs dos documentos da manutenção (JSON array)';
