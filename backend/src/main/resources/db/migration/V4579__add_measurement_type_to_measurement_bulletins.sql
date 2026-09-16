ALTER TABLE measurement_bulletins ADD COLUMN IF NOT EXISTS measurement_type VARCHAR(50) DEFAULT 'GLOBAL';
