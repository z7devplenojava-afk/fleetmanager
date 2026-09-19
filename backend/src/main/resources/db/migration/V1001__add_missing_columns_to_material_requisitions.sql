ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP;
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivered_by_id UUID;
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivered_by_name VARCHAR(255);
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS received_by_name VARCHAR(255);
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS origin_department VARCHAR(255);
