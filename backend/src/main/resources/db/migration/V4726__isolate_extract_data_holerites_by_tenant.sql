-- Isolamento multi-tenant dos dados extraídos de holerites.
-- Registros antigos ficam sem empresa (NULL) e, portanto, não são exibidos
-- a nenhum tenant até serem reprocessados pela importação de holerites.
ALTER TABLE tb_extract_data_holerites ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_extract_data_holerites_company
    ON tb_extract_data_holerites(company_id);
