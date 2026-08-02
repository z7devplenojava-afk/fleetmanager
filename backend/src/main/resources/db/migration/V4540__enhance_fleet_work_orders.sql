-- V4540: Enhancementos na Gestão de O.S. de Frota
-- Adiciona: odômetro, tempo parado, motivo da parada, histórico de atividades

-- Campos de odômetro e parada
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS odometer_in      INTEGER;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS odometer_out     INTEGER;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS stop_reason      TEXT;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS mechanic_name    VARCHAR(255);
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS labor_cost       DECIMAL(15,2) DEFAULT 0;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS parts_cost       DECIMAL(15,2) DEFAULT 0;
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS os_number        VARCHAR(50);
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS actual_date      DATE;

-- Gerar número de OS automaticamente (sequência simples por empresa)
CREATE SEQUENCE IF NOT EXISTS fleet_os_seq START 1000 INCREMENT 1;

-- Atualizar OSs existentes sem número
UPDATE fleet_work_orders
SET os_number = 'OS-' || LPAD(NEXTVAL('fleet_os_seq')::TEXT, 6, '0')
WHERE os_number IS NULL;

-- Tabela de histórico / timeline da OS (auditoria e anotações do mecânico)
CREATE TABLE IF NOT EXISTS fleet_work_order_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES fleet_work_orders(id) ON DELETE CASCADE,
    action_type     VARCHAR(50) NOT NULL, -- STATUS_CHANGE, NOTE, PART_ADDED, COST_UPDATE
    description     TEXT NOT NULL,
    performed_by    VARCHAR(255),
    old_value       TEXT,
    new_value       TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wo_history_order ON fleet_work_order_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_history_created ON fleet_work_order_history(created_at);

-- Índice para ranking por veículo
CREATE INDEX IF NOT EXISTS idx_fwo_vehicle_status ON fleet_work_orders(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_fwo_vehicle_cost ON fleet_work_orders(vehicle_id, total_cost);
