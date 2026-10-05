-- PRD Viasao Sao Silvestre - Fase 1: Motoristas com CPF, CNH e vinculo de usuario
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(10);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cnh_expiration DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE drivers ADD CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_cnh_category CHECK (cnh_category IS NULL OR cnh_category IN ('A', 'B', 'C', 'D', 'E', 'ACC'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_drivers_cpf ON drivers(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_cnh_expiration ON drivers(cnh_expiration);
