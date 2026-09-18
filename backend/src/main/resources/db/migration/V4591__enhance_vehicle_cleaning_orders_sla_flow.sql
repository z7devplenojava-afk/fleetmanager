-- =====================================================================
-- Gestão de Limpeza de Veículos — fluxo ponta a ponta (SLA, fases, qualidade)
-- V4591: novas colunas em vehicle_cleaning_orders
-- =====================================================================

ALTER TABLE vehicle_cleaning_orders
    ADD COLUMN IF NOT EXISTS requester_sector VARCHAR(20),
    ADD COLUMN IF NOT EXISTS priority VARCHAR(10),
    ADD COLUMN IF NOT EXISTS phase VARCHAR(20),
    ADD COLUMN IF NOT EXISTS release_deadline TIMESTAMP,
    ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS current_phase VARCHAR(20),
    ADD COLUMN IF NOT EXISTS standard_time_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS delay_alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS quality_approved BOOLEAN,
    ADD COLUMN IF NOT EXISTS quality_inspected_by VARCHAR(120),
    ADD COLUMN IF NOT EXISTS quality_inspected_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS quality_checklist TEXT,
    ADD COLUMN IF NOT EXISTS release_spot VARCHAR(20),
    ADD COLUMN IF NOT EXISTS released_at TIMESTAMP;

-- Backfill: ordens existentes entram na fila (AGUARDANDO), prioridade normal
UPDATE vehicle_cleaning_orders SET phase = 'AGUARDANDO' WHERE phase IS NULL AND status = 'PENDING';
UPDATE vehicle_cleaning_orders SET phase = 'LIBERADO' WHERE phase IS NULL AND status = 'COMPLETED';
UPDATE vehicle_cleaning_orders SET priority = 'NORMAL' WHERE priority IS NULL;

CREATE INDEX IF NOT EXISTS idx_vco_status_delay_alert ON vehicle_cleaning_orders (status, delay_alert_sent);
CREATE INDEX IF NOT EXISTS idx_vco_company_created ON vehicle_cleaning_orders (company_id, created_at DESC);
