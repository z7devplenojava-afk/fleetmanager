-- Migration V369: Create purchase_quotations table and add purchase_request_id column
-- Description: Creates the purchase_quotations table if it doesn't exist and adds a foreign key to link purchase quotations to purchase requests

-- Create table (simplified - no IF NOT EXISTS in constraints to avoid issues)
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

-- Add foreign keys only if they don't exist
DO $$ 
BEGIN
    -- Supplier foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchase_quotations_supplier'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE purchase_quotations
        ADD CONSTRAINT fk_purchase_quotations_supplier 
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
    END IF;
    
    -- Unit foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchase_quotations_unit'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE purchase_quotations
        ADD CONSTRAINT fk_purchase_quotations_unit 
        FOREIGN KEY (unit_id) REFERENCES units(id);
    END IF;
    
    -- Created by foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchase_quotations_created_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE purchase_quotations
        ADD CONSTRAINT fk_purchase_quotations_created_by 
        FOREIGN KEY (created_by_id) REFERENCES users(id);
    END IF;
    
    -- Assigned to foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchase_quotations_assigned_to'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE purchase_quotations
        ADD CONSTRAINT fk_purchase_quotations_assigned_to 
        FOREIGN KEY (assigned_to_id) REFERENCES users(id);
    END IF;
    
    -- Purchase request foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchase_quotations_purchase_request'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE purchase_quotations
        ADD CONSTRAINT fk_purchase_quotations_purchase_request 
        FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_quotations_purchase_request_id 
ON purchase_quotations(purchase_request_id);

-- Add comment
COMMENT ON COLUMN purchase_quotations.purchase_request_id IS 'Reference to the purchase request this quotation is related to';
