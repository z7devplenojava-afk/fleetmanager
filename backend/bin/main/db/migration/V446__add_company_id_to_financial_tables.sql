-- Migration V446: Add company_id to remaining financial tables
-- Supporting multi-tenant isolation for Billing and Purchases

-- 1. invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);

-- 2. purchase_requests
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_purchase_requests_company_id ON purchase_requests(company_id);

-- 3. purchase_quotations
ALTER TABLE purchase_quotations ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_purchase_quotations_company_id ON purchase_quotations(company_id);

-- Add foreign keys for data integrity
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_company') THEN
        ALTER TABLE invoices ADD CONSTRAINT fk_invoices_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_purchase_requests_company') THEN
        ALTER TABLE purchase_requests ADD CONSTRAINT fk_purchase_requests_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_purchase_quotations_company') THEN
        ALTER TABLE purchase_quotations ADD CONSTRAINT fk_purchase_quotations_company FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
END $$;
