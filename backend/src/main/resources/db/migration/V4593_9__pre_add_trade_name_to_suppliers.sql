-- Migration V4593.9: Pre-add trade_name and contact_name to suppliers BEFORE V4594 seed uses them
-- Flyway runs migrations in version order: V4593 -> V4593.9 -> V4594 -> V4595
-- This ensures trade_name column exists before V4594 attempts INSERT using it.

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);

-- Make cnpj nullable to avoid constraint errors in seed data from V4594
ALTER TABLE suppliers ALTER COLUMN cnpj DROP NOT NULL;
