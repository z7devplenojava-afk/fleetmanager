-- Create fleet component preventive controls (Alinhamento, Óleo de Motor, Rolamento Polia, Arranque, Alternador)

ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS preventive_control_types VARCHAR(255);
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS oil_filter_changed BOOLEAN DEFAULT FALSE;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS diesel_filter_changed BOOLEAN DEFAULT FALSE;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS water_separator_filter_changed BOOLEAN DEFAULT FALSE;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS air_filter_changed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS fleet_component_control_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE,
    alignment_interval_km INTEGER NOT NULL DEFAULT 20000,
    engine_oil_interval_km INTEGER NOT NULL DEFAULT 25000,
    pulley_bearing_interval_km INTEGER NOT NULL DEFAULT 20000,
    starter_interval_km INTEGER NOT NULL DEFAULT 200000,
    alternator_interval_km INTEGER NOT NULL DEFAULT 150000,
    alert_threshold_km INTEGER NOT NULL DEFAULT 3000,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fleet_component_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    control_type VARCHAR(40) NOT NULL,
    work_order_id UUID REFERENCES fleet_work_orders(id) ON DELETE SET NULL,
    os_number VARCHAR(50),
    service_date DATE,
    service_km INTEGER,
    next_due_km INTEGER NOT NULL,
    interval_km INTEGER NOT NULL,
    oil_filter_changed BOOLEAN NOT NULL DEFAULT FALSE,
    diesel_filter_changed BOOLEAN NOT NULL DEFAULT FALSE,
    water_separator_filter_changed BOOLEAN NOT NULL DEFAULT FALSE,
    air_filter_changed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fcc_company_type_latest ON fleet_component_controls(company_id, control_type, is_latest);
CREATE INDEX IF NOT EXISTS idx_fcc_vehicle_type ON fleet_component_controls(vehicle_id, control_type, is_latest);
CREATE INDEX IF NOT EXISTS idx_fcc_work_order ON fleet_component_controls(work_order_id);

