CREATE TABLE vehicle_gate_checklists (
  id UUID PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('EXIT', 'ARRIVAL')),
  occurred_at TIMESTAMP NOT NULL,
  km_reading INTEGER NOT NULL,
  checklist_data TEXT,
  driver_problem_report TEXT,
  observations TEXT,
  company_id UUID,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_gate_checklist_vehicle ON vehicle_gate_checklists(vehicle_id);
CREATE INDEX idx_gate_checklist_occurred ON vehicle_gate_checklists(occurred_at);
CREATE INDEX idx_gate_checklist_type ON vehicle_gate_checklists(type);
