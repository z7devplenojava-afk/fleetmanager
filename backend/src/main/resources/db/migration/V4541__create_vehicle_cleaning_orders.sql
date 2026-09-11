CREATE TABLE vehicle_cleaning_orders (
  id UUID PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  driver_user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  cleaning_type VARCHAR(20) NOT NULL CHECK (cleaning_type IN ('INTERNAL', 'EXTERNAL', 'COMPLETE')),
  checklist_data TEXT,
  observations TEXT,
  driver_phone VARCHAR(20),
  requested_by UUID REFERENCES users(id),
  completed_at TIMESTAMP,
  company_id UUID,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_cleaning_orders_vehicle ON vehicle_cleaning_orders(vehicle_id);
CREATE INDEX idx_cleaning_orders_status ON vehicle_cleaning_orders(status);
CREATE INDEX idx_cleaning_orders_company ON vehicle_cleaning_orders(company_id);
