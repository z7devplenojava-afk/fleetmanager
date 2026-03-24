-- Add company_sigla column to invoices for quick company identification
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS company_sigla VARCHAR(10);

-- Optional index for filtering/reporting by company_sigla
CREATE INDEX IF NOT EXISTS idx_invoices_company_sigla ON invoices(company_sigla);


