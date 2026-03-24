-- Migration V441: Add company_id column to all tenant-aware entities
-- This migration adds company_id to support SaaS multi-tenant isolation

-- ============================================
-- 1. HR & Personnel Tables
-- ============================================

-- departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);

-- drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(company_id);

-- pay_periods
ALTER TABLE pay_periods ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_pay_periods_company_id ON pay_periods(company_id);

-- absences
ALTER TABLE absences ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_absences_company_id ON absences(company_id);

-- benefits
ALTER TABLE benefits ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_benefits_company_id ON benefits(company_id);

-- schedules (added for operational scheduling)
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_schedules_company_id ON schedules(company_id);

-- ============================================
-- 2. Finance Tables
-- ============================================

-- accounts_receivable
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_company_id ON accounts_receivable(company_id);

-- payment_receipts
ALTER TABLE payment_receipts ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_payment_receipts_company_id ON payment_receipts(company_id);

-- cost_centers
ALTER TABLE cost_centers ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_cost_centers_company_id ON cost_centers(company_id);

-- inventories
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_inventories_company_id ON inventories(company_id);

-- stock_items
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_stock_items_company_id ON stock_items(company_id);

-- ============================================
-- 3. Maintenance & Fleet Tables
-- ============================================

-- fleet_work_orders
ALTER TABLE fleet_work_orders ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_fleet_work_orders_company_id ON fleet_work_orders(company_id);

-- vehicle_maintenances
ALTER TABLE vehicle_maintenances ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_company_id ON vehicle_maintenances(company_id);

-- fuel_records
ALTER TABLE fuel_records ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_fuel_records_company_id ON fuel_records(company_id);

-- ============================================
-- 4. Products & Services Tables
-- ============================================

-- products
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

-- services
ALTER TABLE services ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_services_company_id ON services(company_id);

-- ============================================
-- 5. System Tables
-- ============================================

-- documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);

-- notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);

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
