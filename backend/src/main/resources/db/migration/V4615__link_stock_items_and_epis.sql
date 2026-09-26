-- V4615__link_stock_items_and_epis.sql
-- Sincronização entre Estoque e Módulo SST (EPIs, CA, Validade e Controle de Saldo)

-- 1. Adicionar campos de EPI na tabela stock_items
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS ca_number VARCHAR(50);
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS ca_validity DATE;
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS epi_id UUID;

-- 2. Adicionar vínculo na tabela personal_protective_equipment
ALTER TABLE personal_protective_equipment ADD COLUMN IF NOT EXISTS stock_item_id UUID;
ALTER TABLE personal_protective_equipment ADD COLUMN IF NOT EXISTS company_id UUID;

-- 3. Adicionar vínculo na tabela de itens de ficha de entrega de EPI
ALTER TABLE epi_delivery_form_items ADD COLUMN IF NOT EXISTS stock_item_id UUID;

-- 4. Criar índices para busca rápida e integridade
CREATE INDEX IF NOT EXISTS idx_stock_items_ca_number ON stock_items(ca_number);
CREATE INDEX IF NOT EXISTS idx_stock_items_epi_id ON stock_items(epi_id);
CREATE INDEX IF NOT EXISTS idx_ppe_stock_item_id ON personal_protective_equipment(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_ppe_company_id ON personal_protective_equipment(company_id);
CREATE INDEX IF NOT EXISTS idx_epi_delivery_form_items_stock_item ON epi_delivery_form_items(stock_item_id);

COMMENT ON COLUMN stock_items.ca_number IS 'Número do Certificado de Aprovação (CA) do EPI';
COMMENT ON COLUMN stock_items.ca_validity IS 'Data de validade do CA do EPI';
COMMENT ON COLUMN stock_items.epi_id IS 'ID do EPI correspondente no módulo de SST';
COMMENT ON COLUMN personal_protective_equipment.stock_item_id IS 'ID do item de estoque correspondente no almoxarifado';
