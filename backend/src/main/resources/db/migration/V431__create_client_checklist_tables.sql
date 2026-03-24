-- Modelo de checklist por cliente
CREATE TABLE client_checklist_templates (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  revision VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_client_checklist_template_client ON client_checklist_templates(client_id);

-- Itens do modelo de checklist
CREATE TABLE client_checklist_template_items (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES client_checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_client_checklist_item_template ON client_checklist_template_items(template_id);

-- Registros preenchidos do checklist
CREATE TABLE client_checklist_records (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES client_checklist_templates(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  occurred_at TIMESTAMP NOT NULL,
  km_reading INTEGER,
  responses TEXT,
  observations TEXT,
  equipment_released BOOLEAN,
  odometer_photo_url VARCHAR(500),
  odometer_photo_description TEXT,
  vehicle_photos TEXT,
  inspector_name VARCHAR(255),
  inspector_signature TEXT,
  driver_signature TEXT,
  company_id UUID,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_client_checklist_record_client ON client_checklist_records(client_id);
CREATE INDEX idx_client_checklist_record_template ON client_checklist_records(template_id);
CREATE INDEX idx_client_checklist_record_occurred ON client_checklist_records(occurred_at);
CREATE INDEX idx_client_checklist_record_vehicle ON client_checklist_records(vehicle_id);
