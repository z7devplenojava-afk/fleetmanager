-- Migration V4696: Adicionar campos específicos do Laudo de Inspeção Oficial
ALTER TABLE vehicle_inspections
    ADD COLUMN IF NOT EXISTS horimeter_hours VARCHAR(50),
    ADD COLUMN IF NOT EXISTS execution_team VARCHAR(200),
    ADD COLUMN IF NOT EXISTS problem_description TEXT,
    ADD COLUMN IF NOT EXISTS parts_replaced TEXT,
    ADD COLUMN IF NOT EXISTS manager_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS engineer_name VARCHAR(200);

-- Garantir índice para busca rápida por placa e por número de registro
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_plate ON vehicle_inspections(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_reg_num ON vehicle_inspections(registry_number);
