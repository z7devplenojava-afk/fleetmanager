-- V4678__add_trocar_status_and_vehicle_model_to_checklist.sql
-- Adiciona suporte a modelo de veículo e status TROCAR para checklists preventivos multiempresa

ALTER TABLE checklist_itens ADD COLUMN IF NOT EXISTS vehicle_model_applicable VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_checklist_itens_model ON checklist_itens(vehicle_model_applicable);
CREATE INDEX IF NOT EXISTS idx_checklist_itens_company_type ON checklist_itens(company_id, vehicle_type_applicable);

