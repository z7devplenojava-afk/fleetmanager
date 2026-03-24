-- Script manual para criar a tabela purchase_quotations
-- Execute este script diretamente no banco de dados se a migration V369 não foi executada

-- Create table
CREATE TABLE IF NOT EXISTS purchase_quotations (
    id UUID PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    supplier_id UUID,
    unit_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_value NUMERIC(15, 2) NOT NULL,
    valid_until DATE,
    terms VARCHAR(500),
    payment_method VARCHAR(100),
    delivery_method VARCHAR(100),
    notes TEXT,
    created_by_id UUID NOT NULL,
    assigned_to_id UUID,
    purchase_request_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Add foreign keys
ALTER TABLE purchase_quotations
ADD CONSTRAINT IF NOT EXISTS fk_purchase_quotations_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

ALTER TABLE purchase_quotations
ADD CONSTRAINT IF NOT EXISTS fk_purchase_quotations_unit 
FOREIGN KEY (unit_id) REFERENCES units(id);

ALTER TABLE purchase_quotations
ADD CONSTRAINT IF NOT EXISTS fk_purchase_quotations_created_by 
FOREIGN KEY (created_by_id) REFERENCES users(id);

ALTER TABLE purchase_quotations
ADD CONSTRAINT IF NOT EXISTS fk_purchase_quotations_assigned_to 
FOREIGN KEY (assigned_to_id) REFERENCES users(id);

ALTER TABLE purchase_quotations
ADD CONSTRAINT IF NOT EXISTS fk_purchase_quotations_purchase_request 
FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_purchase_quotations_purchase_request_id 
ON purchase_quotations(purchase_request_id);

-- Add comment
COMMENT ON COLUMN purchase_quotations.purchase_request_id IS 'Reference to the purchase request this quotation is related to';

