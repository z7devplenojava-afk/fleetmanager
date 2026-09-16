-- Migration V4586: Adiciona campos complementares de infração em fines e cria tabela de histórico/cache de consultas veiculares

-- 1. Campos adicionais na tabela fines
ALTER TABLE fines ADD COLUMN IF NOT EXISTS infraction_number VARCHAR(100);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS infraction_code VARCHAR(50);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(100);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS infraction_time VARCHAR(20);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS situation VARCHAR(100);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS parte_diaria_id UUID;
ALTER TABLE fines ADD COLUMN IF NOT EXISTS parte_diaria_number VARCHAR(50);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS suggested_driver_name VARCHAR(200);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS query_origin VARCHAR(50) DEFAULT 'MANUAL';

-- 2. Tabela de histórico e cache de consultas veiculares
CREATE TABLE IF NOT EXISTS vehicle_query_cache (
    id UUID PRIMARY KEY,
    company_id UUID,
    plate VARCHAR(20) NOT NULL,
    renavam VARCHAR(30),
    uf VARCHAR(10),
    status VARCHAR(50) NOT NULL,
    vehicle_brand_model VARCHAR(150),
    vehicle_year INT,
    vehicle_color VARCHAR(50),
    vehicle_city VARCHAR(100),
    total_fines INT DEFAULT 0,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    restrictions_json TEXT,
    response_json TEXT,
    origin VARCHAR(50) DEFAULT 'API_LIVE',
    queried_by VARCHAR(150),
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_query_cache_plate ON vehicle_query_cache(plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_query_cache_expires_at ON vehicle_query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_fines_infraction_number ON fines(infraction_number);
