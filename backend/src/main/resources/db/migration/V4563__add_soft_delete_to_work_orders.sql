-- V4563: Soft-delete para Ordens de Servico (RN10 do PRD OS v1.0)
-- Uma OS com status COMPLETED nao pode ser deletada fisicamente
-- A coluna deleted_at identifica registros inativados

ALTER TABLE fleet_work_orders
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITHOUT TIME ZONE;

-- Indice para queries que filtram registros nao deletados
CREATE INDEX IF NOT EXISTS idx_fleet_work_orders_deleted_at
    ON fleet_work_orders (deleted_at)
    WHERE deleted_at IS NULL;
