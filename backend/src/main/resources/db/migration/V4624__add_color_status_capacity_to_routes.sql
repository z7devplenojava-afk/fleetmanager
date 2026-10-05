-- PRD Viasao Sao Silvestre - Fase 1: Linhas com cor, status e capacidade
ALTER TABLE routes ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ATIVA';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS capacity INTEGER;

ALTER TABLE routes ADD CONSTRAINT chk_routes_status CHECK (status IN ('ATIVA', 'INATIVA'));
ALTER TABLE routes ADD CONSTRAINT chk_routes_capacity CHECK (capacity IS NULL OR capacity > 0);
