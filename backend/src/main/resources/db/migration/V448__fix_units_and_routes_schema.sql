-- Migration V448: Fix units table and ensure routes table/columns consistency

-- 1. FIX UNITS TABLE
ALTER TABLE units ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Add foreign key for branch_id in units if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_units_branch') AND 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
        ALTER TABLE units ADD CONSTRAINT fk_units_branch FOREIGN KEY (branch_id) REFERENCES branches(id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_units_branch_id ON units(branch_id);

-- 2. FIX ROUTES TABLE CONSISTENCY
-- If 'rotas' exists and 'routes' doesn't, rename it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rotas') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
        ALTER TABLE rotas RENAME TO routes;
    END IF;
END $$;

-- 3. ENSURE ALL COLUMNS FROM Route.java ARE IN routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS checkpoints_required BOOLEAN DEFAULT FALSE;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS default_radius_meters INTEGER DEFAULT 50;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS origin_cep VARCHAR(10);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS origin_address VARCHAR(500);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_cep VARCHAR(10);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_address VARCHAR(500);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS shift VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS execution_time VARCHAR(10);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS distance_km DOUBLE PRECISION;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS client_id UUID;

-- Add foreign key for client_id in routes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_routes_client') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        ALTER TABLE routes ADD CONSTRAINT fk_routes_client FOREIGN KEY (client_id) REFERENCES clients(id);
    END IF;
END $$;

-- Scheduled times (may be in V435, but better safe)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS scheduled_start_time TIME;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS garage_latitude DOUBLE PRECISION;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS garage_longitude DOUBLE PRECISION;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS garage_name VARCHAR(200);

-- 4. UNIQUE CONSTRAINTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'routes_code_key') THEN
        ALTER TABLE routes ADD CONSTRAINT routes_code_key UNIQUE (code);
    END IF;
END $$;
