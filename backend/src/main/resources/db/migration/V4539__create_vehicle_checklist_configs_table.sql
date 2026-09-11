-- Itens de checklist configuráveis por veículo
-- vehicle_id NULL = template padrão global (aplicado a veículos sem configuração própria)
CREATE TABLE vehicle_checklist_configs (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  company_id UUID,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_checklist_config_vehicle ON vehicle_checklist_configs(vehicle_id);
CREATE INDEX idx_checklist_config_category ON vehicle_checklist_configs(category);
