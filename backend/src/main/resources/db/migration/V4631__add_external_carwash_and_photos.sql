-- V4620__add_external_carwash_and_photos.sql
-- Tabela de Lava-Jatos / Prestadores Externos de Higienização
CREATE TABLE IF NOT EXISTS car_washes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(20),
    phone VARCHAR(20),
    address VARCHAR(255),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    price_internal NUMERIC(15, 2) DEFAULT 0,
    price_external NUMERIC(15, 2) DEFAULT 0,
    price_complete NUMERIC(15, 2) DEFAULT 0,
    price_sanitary NUMERIC(15, 2) DEFAULT 0,
    company_id UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_car_washes_company ON car_washes(company_id);

-- Campos de prestação externa e fotos de evidência na tabela vehicle_cleaning_orders
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS execution_location VARCHAR(20) DEFAULT 'INTERNAL';
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS car_wash_id UUID REFERENCES car_washes(id) ON DELETE SET NULL;
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS car_wash_name VARCHAR(150);
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS cleaning_cost NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS photo_before_internal TEXT;
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS photo_before_external TEXT;
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS photo_after_internal TEXT;
ALTER TABLE vehicle_cleaning_orders ADD COLUMN IF NOT EXISTS photo_after_external TEXT;
