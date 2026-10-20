-- Migration V446: Add company_id to remaining financial tables
-- Supporting multi-tenant isolation for Billing and Purchases

DO $$ 
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY['invoices', 'purchase_requests', 'purchase_quotations'];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS company_id UUID', tbl);
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (company_id)', 'idx_' || tbl || '_company_id', tbl);
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_' || tbl || '_company') THEN
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (company_id) REFERENCES companies(id)', tbl, 'fk_' || tbl || '_company');
            END IF;
        END IF;
    END LOOP;
END $$;
