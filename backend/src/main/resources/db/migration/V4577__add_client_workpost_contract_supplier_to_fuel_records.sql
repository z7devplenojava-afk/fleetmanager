-- Migration V4577: Add client, work_post, contract, supplier and price_per_liter to fuel_records

ALTER TABLE fuel_records 
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS price_per_liter NUMERIC(10, 4),
    ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS obra_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contract_number VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_fuel_records_client_id ON fuel_records(client_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_work_post_id ON fuel_records(work_post_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_contract_id ON fuel_records(contract_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_supplier_id ON fuel_records(supplier_id);
