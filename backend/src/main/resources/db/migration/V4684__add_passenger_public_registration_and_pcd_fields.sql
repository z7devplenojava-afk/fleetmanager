-- ==============================================================================
-- V4684: Adiciona campos de auto-cadastro público, endereço, PCD e LGPD para passageiros
-- Suporte tanto para passageiro corporativo (FRETADO) quanto transporte público (PUBLICO_ALEATORIO)
-- ==============================================================================

ALTER TABLE passengers ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS street VARCHAR(150);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS number VARCHAR(20);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS is_pcd BOOLEAN DEFAULT FALSE;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS disability_type VARCHAR(50);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS disability_description TEXT;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS lgpd_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS lgpd_accepted_at TIMESTAMP;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS passenger_category VARCHAR(30) DEFAULT 'FRETADO';

CREATE INDEX IF NOT EXISTS idx_passengers_cpf ON passengers(cpf);
CREATE INDEX IF NOT EXISTS idx_passengers_category ON passengers(passenger_category);
