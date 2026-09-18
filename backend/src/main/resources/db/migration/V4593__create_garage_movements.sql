-- =====================================================================
-- Remanejamento entre garagens (V4593)
-- Histórico de movimentações de veículos entre garagens
-- =====================================================================

CREATE TABLE IF NOT EXISTS garage_movements (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    vehicle_plate VARCHAR(20),
    from_garage_id UUID,
    from_garage_name VARCHAR(150),
    to_garage_id UUID NOT NULL,
    to_garage_name VARCHAR(150),
    reason VARCHAR(30),
    reason_detail VARCHAR(500),
    performed_by UUID,
    performed_by_name VARCHAR(120),
    km_reading INTEGER,
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_company_created ON garage_movements (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_vehicle ON garage_movements (vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_to_garage ON garage_movements (to_garage_id, created_at DESC);
