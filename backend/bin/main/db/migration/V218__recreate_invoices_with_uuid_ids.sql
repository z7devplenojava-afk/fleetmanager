-- Recreate invoices table to use UUID primary key and UUID foreign keys
-- This fixes runtime 500s caused by type mismatches (entity uses UUID, table had BIGSERIAL/BIGINT)

DO $$
BEGIN
    -- Create new table with correct schema
    CREATE TABLE IF NOT EXISTS invoices_uuid (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        amount NUMERIC(15,2) NOT NULL,
        type VARCHAR(20) DEFAULT 'VARIAVEL',
        status VARCHAR(20) NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        payment_date DATE,
        category VARCHAR(100),
        barcode VARCHAR(255),
        baixa VARCHAR(255),
        comprovante_url VARCHAR(500),
        notes TEXT,
        supplier_id UUID,
        client_id UUID,
        contract_id UUID,
        unit_id UUID NOT NULL,
        company_sigla VARCHAR(10),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );

    -- Copy data from old table if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        INSERT INTO invoices_uuid (
            invoice_number, description, amount, type, status,
            issue_date, due_date, payment_date, category, barcode, baixa,
            comprovante_url, notes, supplier_id, client_id, contract_id,
            unit_id, company_sigla, created_at, updated_at
        )
        SELECT 
            invoice_number, description, amount, COALESCE(type, 'VARIAVEL'), status,
            issue_date, due_date, payment_date, category, barcode, baixa,
            NULLIF(comprovante_url, '')::VARCHAR(500), notes,
            NULL, -- supplier_id cannot be reliably converted from BIGINT to UUID
            NULL, -- client_id cannot be reliably converted from BIGINT to UUID
            NULL, -- contract_id cannot be reliably converted from BIGINT to UUID
            unit_id::UUID, company_sigla, created_at, updated_at
        FROM invoices;
    END IF;

    -- Drop old FKs referencing invoices if they exist (best-effort)
    -- Note: If there are dependent constraints, they should be adapted separately

    -- Replace old table
    DROP TABLE IF EXISTS invoices CASCADE;
    ALTER TABLE invoices_uuid RENAME TO invoices;

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
    CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category);
    CREATE INDEX IF NOT EXISTS idx_invoices_barcode ON invoices(barcode);
    CREATE INDEX IF NOT EXISTS idx_invoices_status_type ON invoices(status, type);
    CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status ON invoices(due_date, status);
    CREATE INDEX IF NOT EXISTS idx_invoices_unit_id ON invoices(unit_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_company_sigla ON invoices(company_sigla);

    -- Recreate foreign keys as UUID (guarded and idempotent)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE table_name = 'invoices' AND constraint_name = 'fk_invoices_supplier_uuid'
       ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_supplier_uuid
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE table_name = 'invoices' AND constraint_name = 'fk_invoices_client_uuid'
       ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_client_uuid
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE table_name = 'invoices' AND constraint_name = 'fk_invoices_contract_uuid'
       ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_contract_uuid
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE table_name = 'invoices' AND constraint_name = 'fk_invoices_unit_uuid'
       ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_unit_uuid
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT;
    END IF;
END;
$$;


