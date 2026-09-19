-- Adiciona coluna invoice_number à tabela stock_items para armazenar a nota fiscal
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

-- Remove a restrição fixa de categorias de uniforme antigas para permitir categorias de frota e oficina
ALTER TABLE stock_items DROP CONSTRAINT IF EXISTS chk_stock_category;
