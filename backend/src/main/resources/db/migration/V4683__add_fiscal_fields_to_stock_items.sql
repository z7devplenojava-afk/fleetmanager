-- ==============================================================================
-- V4683: Adiciona campos fiscais e comerciais na tabela stock_items (Almoxarifado)
-- Campos presentes no DANFE: NCM/SH, CST/CSOSN, CFOP e Unidade de Medida (UN)
-- ==============================================================================

ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS ncm VARCHAR(20);
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS cst VARCHAR(10);
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS cfop VARCHAR(10);
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS unit_measure VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_stock_items_ncm ON stock_items(ncm);
CREATE INDEX IF NOT EXISTS idx_stock_items_invoice_number ON stock_items(invoice_number);

