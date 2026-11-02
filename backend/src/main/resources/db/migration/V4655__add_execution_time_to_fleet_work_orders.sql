-- ===========================================================================
-- V4655: Adiciona campos de rastreamento de Tempo de Execução na OS
-- ===========================================================================

ALTER TABLE fleet_work_orders
    ADD COLUMN IF NOT EXISTS execution_start_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS execution_end_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS execution_duration_minutes BIGINT,
    ADD COLUMN IF NOT EXISTS execution_start_justification TEXT;

-- Tabela de histórico de correções do início da execução
CREATE TABLE IF NOT EXISTS fleet_work_order_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES fleet_work_orders(id) ON DELETE CASCADE,
    previous_start_date TIMESTAMP,
    new_start_date TIMESTAMP NOT NULL,
    justification TEXT NOT NULL,
    performed_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fwo_exec_hist_wo_id ON fleet_work_order_execution_history(work_order_id);
