-- PRD Viasao Sao Silvestre - Fase 1: Passageiros com contatos, tipo e preferencias
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS passenger_type VARCHAR(20) NOT NULL DEFAULT 'COMUM';
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS preferred_time TIME;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS disembark_point_id UUID;

ALTER TABLE passengers ADD CONSTRAINT fk_passengers_disembark_point FOREIGN KEY (disembark_point_id) REFERENCES route_points(id) ON DELETE SET NULL;
ALTER TABLE passengers ADD CONSTRAINT chk_passengers_type CHECK (passenger_type IN ('COMUM', 'ESTUDANTE', 'IDOSO', 'PCD'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_passengers_cpf ON passengers(cpf) WHERE cpf IS NOT NULL;
