-- Enhance tires lifecycle tracking, calibration parameters, and front-axle safety exception auditing

-- 1. Evolução da tabela tires
ALTER TABLE tires ADD COLUMN IF NOT EXISTS fire_number VARCHAR(80);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS current_life_mileage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS line_type VARCHAR(30) DEFAULT 'URBANA';
ALTER TABLE tires ADD COLUMN IF NOT EXISTS location_notes VARCHAR(255);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS recap_vendor VARCHAR(150);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS last_recap_date TIMESTAMP;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS scrap_reason VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_tires_fire_number ON tires(fire_number);

-- 2. Evolução da tabela tire_movements
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS position_code VARCHAR(20);
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS tread_depth_mm DECIMAL(5,2);
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS km_driven_cycle INTEGER;
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS recap_count_snapshot INTEGER;
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS authorized_by_user_id UUID;
ALTER TABLE tire_movements ADD COLUMN IF NOT EXISTS authorized_by_name VARCHAR(150);

-- 3. Tabela de parâmetros de ciclo de vida e calibração por tipo de linha
CREATE TABLE IF NOT EXISTS tire_lifecycle_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE,
    first_life_min_km INTEGER NOT NULL DEFAULT 90000,
    first_life_max_km INTEGER NOT NULL DEFAULT 120000,
    second_life_min_km INTEGER NOT NULL DEFAULT 90000,
    second_life_max_km INTEGER NOT NULL DEFAULT 140000,
    third_life_min_km INTEGER NOT NULL DEFAULT 80000,
    third_life_max_km INTEGER NOT NULL DEFAULT 100000,
    max_recap_count INTEGER NOT NULL DEFAULT 2,
    min_tread_depth_twi DECIMAL(4,2) NOT NULL DEFAULT 1.60,
    alert_tread_depth_mm DECIMAL(4,2) NOT NULL DEFAULT 3.00,
    dot_max_age_years INTEGER NOT NULL DEFAULT 5,
    urban_calibration_factor DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    metropolitan_calibration_factor DECIMAL(5,2) NOT NULL DEFAULT 1.10,
    road_calibration_factor DECIMAL(5,2) NOT NULL DEFAULT 1.25,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de auditoria de exceções críticas no eixo dianteiro (direcional)
CREATE TABLE IF NOT EXISTS tire_front_axle_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    tire_id UUID NOT NULL REFERENCES tires(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(30),
    vehicle_fleet_number VARCHAR(60),
    axle_number INTEGER NOT NULL DEFAULT 1,
    position_code VARCHAR(20),
    tire_fire_number VARCHAR(80),
    tire_serial_number VARCHAR(100),
    recap_count INTEGER NOT NULL,
    vehicle_km_at_mount INTEGER,
    authorized_by_user_id UUID NOT NULL,
    authorized_by_name VARCHAR(150) NOT NULL,
    authorized_by_role VARCHAR(100),
    risk_acknowledged BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    message_sent BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    approved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cleared_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tire_front_exceptions_company ON tire_front_axle_exceptions(company_id);
CREATE INDEX IF NOT EXISTS idx_tire_front_exceptions_active ON tire_front_axle_exceptions(active);
CREATE INDEX IF NOT EXISTS idx_tire_front_exceptions_vehicle ON tire_front_axle_exceptions(vehicle_id);

