DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'departments', 'drivers', 'pay_periods', 'absences', 'benefits',
        'schedules', 'accounts_receivable', 'payment_receipts', 'cost_centers',
        'inventories', 'stock_items', 'fleet_work_orders', 'vehicle_maintenances',
        'fuel_records', 'products', 'services', 'documents', 'notifications'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS company_id UUID', tbl);
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (company_id)', 'idx_' || tbl || '_company_id', tbl);
        END IF;
    END LOOP;
END $$;

-- ============================================
-- 6. Data Migration (Optional)
-- ============================================
-- Uncomment the following section if you want to set a default company
-- for existing records. Replace 'YOUR-DEFAULT-COMPANY-UUID' with actual UUID.

-- UPDATE departments SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE drivers SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE pay_periods SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE absences SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE benefits SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE accounts_receivable SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE payment_receipts SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE cost_centers SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE inventories SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE stock_items SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE fleet_work_orders SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE vehicle_maintenances SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE fuel_records SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE products SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE services SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE documents SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE notifications SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;

-- ============================================
-- 7. Future: Make company_id NOT NULL
-- ============================================
-- After data migration is complete, uncomment to enforce NOT NULL constraint:
-- ALTER TABLE departments ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE drivers ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE pay_periods ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE absences ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE benefits ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE accounts_receivable ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE payment_receipts ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE cost_centers ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE inventories ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE stock_items ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE fleet_work_orders ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE vehicle_maintenances ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE fuel_records ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE services ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE documents ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE notifications ALTER COLUMN company_id SET NOT NULL;
