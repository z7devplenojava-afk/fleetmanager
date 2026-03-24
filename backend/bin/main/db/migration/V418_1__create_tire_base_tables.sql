-- Migration to create missing tire tables
-- Description: Creates the base tables for tires and tire movements.

-- 1. Tabela de Pneus
CREATE TABLE IF NOT EXISTS tires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_mileage INTEGER NOT NULL DEFAULT 0,
    recap_count INTEGER DEFAULT 0,
    vehicle_id UUID REFERENCES vehicles(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Movimentações de Pneus
CREATE TABLE IF NOT EXISTS tire_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tire_id UUID NOT NULL REFERENCES tires(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    type VARCHAR(50) NOT NULL,
    position VARCHAR(50),
    mileage INTEGER NOT NULL,
    notes TEXT,
    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices básicos
CREATE INDEX idx_tires_serial_number ON tires(serial_number);
CREATE INDEX idx_tires_vehicle_id ON tires(vehicle_id);
CREATE INDEX idx_tire_movements_tire_id ON tire_movements(tire_id);
CREATE INDEX idx_tire_movements_vehicle_id ON tire_movements(vehicle_id);
