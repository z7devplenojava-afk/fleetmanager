-- Ensure required columns exist on invoices (idempotent)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS company_sigla VARCHAR(10);

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100);


