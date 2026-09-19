-- Migration V4597: Add since_date and document_type to suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS since_date DATE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS document_type VARCHAR(10) DEFAULT 'CNPJ';

CREATE INDEX IF NOT EXISTS idx_suppliers_since_date ON suppliers(since_date);
CREATE INDEX IF NOT EXISTS idx_suppliers_doc_type ON suppliers(document_type);
