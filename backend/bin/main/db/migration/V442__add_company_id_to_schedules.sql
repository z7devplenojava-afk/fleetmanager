-- Migration V442: Add company_id column to schedules table
-- This migration adds company_id to schedules table for SaaS multi-tenant isolation

-- schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_schedules_company_id ON schedules(company_id);

-- Optional: Set default company_id for existing records
-- UPDATE schedules SET company_id = 'YOUR-DEFAULT-COMPANY-UUID' WHERE company_id IS NULL;

-- Optional: Make company_id NOT NULL after data migration
-- ALTER TABLE schedules ALTER COLUMN company_id SET NOT NULL;
