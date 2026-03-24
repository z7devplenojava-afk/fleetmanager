-- Add company_sigla column to invoices table (idempotent)
-- This migration checks if the column exists before adding it

DO $$
BEGIN
    -- Check if company_sigla column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'company_sigla'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE invoices ADD COLUMN company_sigla VARCHAR(10);
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_invoices_company_sigla ON invoices(company_sigla);
        
        -- Log the action
        RAISE NOTICE 'Column company_sigla added to invoices table';
    ELSE
        -- Log that column already exists
        RAISE NOTICE 'Column company_sigla already exists in invoices table';
    END IF;
END $$;
