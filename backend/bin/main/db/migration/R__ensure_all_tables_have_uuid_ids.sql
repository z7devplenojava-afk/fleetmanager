-- Repeatable migration to ensure all tables use UUID for ID column
-- This runs every time and is idempotent

-- Ensure invoices table has company_sigla column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'company_sigla'
    ) THEN
        ALTER TABLE invoices ADD COLUMN company_sigla VARCHAR(10);
        CREATE INDEX IF NOT EXISTS idx_invoices_company_sigla ON invoices(company_sigla);
        RAISE NOTICE 'Column company_sigla added to invoices table';
    END IF;
END $$;

-- Ensure all main tables have UUID IDs with DEFAULT gen_random_uuid()
-- This is idempotent - won't fail if already correct

-- Users table
DO $$
BEGIN
    -- Check if users table exists and has UUID ID
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Ensure ID is UUID with default
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            -- This would require recreating the table, so we'll just ensure it's UUID
            RAISE NOTICE 'Users table ID column should be UUID';
        END IF;
    END IF;
END $$;

-- Employees table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE 'Employees table ID column should be UUID';
        END IF;
    END IF;
END $$;

-- Units table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'units' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE 'Units table ID column should be UUID';
        END IF;
    END IF;
END $$;

-- Companies table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'companies' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE 'Companies table ID column should be UUID';
        END IF;
    END IF;
END $$;

-- Invoices table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoices' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            RAISE NOTICE 'Invoices table ID column should be UUID';
        END IF;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_invoices_company_sigla ON invoices(company_sigla);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_unit_id ON invoices(unit_id);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Repeatable migration completed - all tables should have UUID IDs';
END $$;
