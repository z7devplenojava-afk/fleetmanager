-- Migration V4593: Enhance suppliers table for flexible imports (CPF/CNPJ, trade name, registration number)

-- Make cnpj nullable
ALTER TABLE suppliers ALTER COLUMN cnpj DROP NOT NULL;

-- Remove global unique constraint on cnpj if exists and add tenant-aware unique index
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_cnpj_key;

-- Add new columns if they do not exist
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);

-- Create tenant-scoped unique index on company_id and cnpj (ignoring null or empty)
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_company_cnpj 
ON suppliers(company_id, cnpj) 
WHERE cnpj IS NOT NULL AND cnpj <> '';

-- Index for searching trade name and registration number
CREATE INDEX IF NOT EXISTS idx_suppliers_trade_name ON suppliers(trade_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_reg_num ON suppliers(registration_number);
