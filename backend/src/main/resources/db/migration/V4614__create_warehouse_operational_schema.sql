-- =========================================================================
-- V4614: MÓDULO DE ALMOXARIFADO OPERACIONAL, PNEUS, BATERIAS E INVENTÁRIO
-- =========================================================================

-- 1. HIERARQUIA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS warehouse_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    parent_id UUID REFERENCES warehouse_categories(id) ON DELETE SET NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_cat_code UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_wh_cat_parent ON warehouse_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_wh_cat_company ON warehouse_categories(company_id);

-- 2. ENDEREÇAMENTO FÍSICO (LOCALIZAÇÕES)
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    warehouse_name VARCHAR(60) NOT NULL DEFAULT 'Almoxarifado Central',
    aisle VARCHAR(20) NOT NULL,        -- Corredor / Rua
    shelf VARCHAR(20) NOT NULL,        -- Estante / Módulo
    level VARCHAR(20) NOT NULL,        -- Prateleira / Nível
    bin_position VARCHAR(20),          -- Vão / Gaveta
    full_code VARCHAR(80) NOT NULL,    -- Ex: ALM-A-01-02
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_loc_code UNIQUE (company_id, full_code)
);

CREATE INDEX IF NOT EXISTS idx_wh_loc_company ON warehouse_locations(company_id);

-- 3. PRODUTOS / ITENS DE CATÁLOGO
CREATE TABLE IF NOT EXISTS warehouse_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES warehouse_categories(id),
    code VARCHAR(50) NOT NULL,         -- Código interno do produto
    barcode VARCHAR(60),               -- EAN / Código de barras
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_measure VARCHAR(10) NOT NULL, -- UN, LT, KG, PAR, MT
    tracking_type VARCHAR(30) NOT NULL DEFAULT 'QUANTITY', 
    -- 'QUANTITY', 'LOT_EXPIRATION', 'SERIAL_NUMBER', 'INDIVIDUAL_TIRE', 'INDIVIDUAL_BATTERY'
    default_location_id UUID REFERENCES warehouse_locations(id),
    min_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    max_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    reorder_point NUMERIC(12, 3) NOT NULL DEFAULT 0,
    lead_time_days INTEGER DEFAULT 7,
    unit_cost_average NUMERIC(15, 4) DEFAULT 0,
    last_purchase_price NUMERIC(15, 4) DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_prod_code UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_wh_prod_barcode ON warehouse_products(company_id, barcode);
CREATE INDEX IF NOT EXISTS idx_wh_prod_cat ON warehouse_products(category_id);
CREATE INDEX IF NOT EXISTS idx_wh_prod_company ON warehouse_products(company_id);

-- 4. SALDO DE ESTOQUE POR LOCALIZAÇÃO
CREATE TABLE IF NOT EXISTS warehouse_stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES warehouse_products(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES warehouse_locations(id) ON DELETE RESTRICT,
    quantity_physical NUMERIC(12, 3) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(12, 3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_prod_loc UNIQUE (company_id, product_id, location_id),
    CONSTRAINT chk_qty_physical CHECK (quantity_physical >= 0)
);

CREATE INDEX IF NOT EXISTS idx_wh_stock_prod ON warehouse_stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_wh_stock_loc ON warehouse_stock_levels(location_id);

-- 5. DOCUMENTO DE ENTRADA (NF-E / COMPRAS)
CREATE TABLE IF NOT EXISTS warehouse_inbound_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    document_number VARCHAR(30) NOT NULL,   -- Número da NF
    series VARCHAR(10),                     -- Série
    access_key VARCHAR(44),                 -- Chave de 44 dígitos da NF-e
    supplier_cnpj VARCHAR(20) NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    arrival_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_products_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_invoice_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEBIDA',
    -- 'RECEBIDA', 'EM_CONFERENCIA', 'CONFERIDA', 'DIVERGENTE', 'ESTOQUE_PROCESSADO', 'FINANCEIRO_PROCESSADO', 'FINALIZADA', 'CANCELADA', 'ESTORNADA'
    receiver_user_id UUID NOT NULL,
    checked_user_id UUID,
    checked_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_doc_key UNIQUE (company_id, access_key)
);

CREATE INDEX IF NOT EXISTS idx_wh_doc_status ON warehouse_inbound_documents(company_id, status);
CREATE INDEX IF NOT EXISTS idx_wh_doc_company ON warehouse_inbound_documents(company_id);

-- 6. ITENS DO DOCUMENTO DE ENTRADA
CREATE TABLE IF NOT EXISTS warehouse_inbound_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inbound_document_id UUID NOT NULL REFERENCES warehouse_inbound_documents(id) ON DELETE CASCADE,
    product_id UUID REFERENCES warehouse_products(id),
    product_code_invoice VARCHAR(60) NOT NULL,
    product_description_invoice VARCHAR(150) NOT NULL,
    ncm VARCHAR(10),
    unit_measure VARCHAR(10) NOT NULL,
    quantity_invoiced NUMERIC(12, 3) NOT NULL,
    quantity_checked NUMERIC(12, 3) DEFAULT 0,
    unit_price NUMERIC(15, 4) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    lot_number VARCHAR(50),
    expiration_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wh_inbound_items_doc ON warehouse_inbound_items(inbound_document_id);

-- 7. PARCELAS / DUPLICATAS FINANCEIRAS DO DOCUMENTO
CREATE TABLE IF NOT EXISTS warehouse_inbound_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inbound_document_id UUID NOT NULL REFERENCES warehouse_inbound_documents(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    barcode VARCHAR(60),
    account_payable_id UUID, -- Vinculado à tabela contas_a_pagar
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wh_inbound_inst_doc ON warehouse_inbound_installments(inbound_document_id);

-- 8. MOVIMENTAÇÕES DE ESTOQUE (LEDGER IMUTÁVEL)
CREATE TABLE IF NOT EXISTS warehouse_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES warehouse_products(id),
    location_id UUID REFERENCES warehouse_locations(id),
    movement_type VARCHAR(40) NOT NULL,
    -- 'ENTRADA_COMPRA', 'SAIDA_ORDEM_SERVICO', 'SAIDA_CONSUMO', 'TRANSFERENCIA', 'DEVOLUCAO', 'INSTALACAO_VEICULO', 'REMOCAO_VEICULO', 'ENVIO_REFORMA', 'RETORNO_REFORMA', 'AJUSTE_INVENTARIO_ENTRADA', 'AJUSTE_INVENTARIO_SAIDA', 'SUCATA_DESCARTE'
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    inbound_document_id UUID REFERENCES warehouse_inbound_documents(id),
    vehicle_id UUID REFERENCES vehicles(id),
    work_order_id UUID,
    tire_id UUID,
    battery_id UUID,
    batch_number VARCHAR(50),
    notes TEXT,
    performed_by_user_id UUID NOT NULL,
    movement_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wh_mov_prod_date ON warehouse_movements(company_id, product_id, movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_wh_mov_vehicle ON warehouse_movements(vehicle_id);

-- 9. EXTENSÃO DA TABELA TIRES EXISTENTE (EVOLUÇÃO)
ALTER TABLE tires ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES warehouse_products(id);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS inbound_item_id UUID REFERENCES warehouse_inbound_items(id);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS dot VARCHAR(20);
ALTER TABLE tires ADD COLUMN IF NOT EXISTS initial_tread_depth NUMERIC(5, 2); -- Sulco original em mm
ALTER TABLE tires ADD COLUMN IF NOT EXISTS current_tread_depth NUMERIC(5, 2); -- Sulco atual em mm
ALTER TABLE tires ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS total_repair_cost NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS cpk NUMERIC(10, 4) DEFAULT 0;       -- Custo Por Quilômetro
ALTER TABLE tires ADD COLUMN IF NOT EXISTS install_km INTEGER;
ALTER TABLE tires ADD COLUMN IF NOT EXISTS install_date TIMESTAMP WITHOUT TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tires_company ON tires(company_id);
CREATE INDEX IF NOT EXISTS idx_tires_product ON tires(product_id);

-- 10. EXTENSÃO DA TABELA VEHICLE_BATTERIES (EVOLUÇÃO)
ALTER TABLE vehicle_batteries ALTER COLUMN vehicle_id DROP NOT NULL;
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES warehouse_products(id);
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS inbound_item_id UUID REFERENCES warehouse_inbound_items(id);
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS serial_number VARCHAR(60);
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS cca_rating INTEGER;     -- Corrente de partida a frio
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS install_km INTEGER;
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS removal_date DATE;
ALTER TABLE vehicle_batteries ADD COLUMN IF NOT EXISTS removal_reason VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_v_batteries_product ON vehicle_batteries(product_id);

-- 11. MÓDULO DE INVENTÁRIO FÍSICO
CREATE TABLE IF NOT EXISTS warehouse_inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    code VARCHAR(30) NOT NULL,
    description VARCHAR(150) NOT NULL,
    scope_type VARCHAR(30) NOT NULL, -- 'ALL', 'CATEGORY', 'LOCATION', 'PRODUCT'
    target_category_id UUID REFERENCES warehouse_categories(id),
    target_location_id UUID REFERENCES warehouse_locations(id),
    freeze_movements BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'CRIADO',
    -- 'CRIADO', 'EM_CONTAGEM', 'CONFERENCIA', 'AGUARDANDO_APROVACAO', 'FINALIZADO', 'CANCELADO'
    opened_by_user_id UUID NOT NULL,
    closed_by_user_id UUID,
    approved_by_user_id UUID,
    opened_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    CONSTRAINT uk_wh_inv_code UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_wh_inv_company ON warehouse_inventory_audits(company_id);

CREATE TABLE IF NOT EXISTS warehouse_inventory_audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES warehouse_inventory_audits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES warehouse_products(id),
    location_id UUID NOT NULL REFERENCES warehouse_locations(id),
    quantity_system NUMERIC(12, 3) NOT NULL,
    quantity_count_1 NUMERIC(12, 3),
    quantity_count_2 NUMERIC(12, 3),
    quantity_final NUMERIC(12, 3),
    difference NUMERIC(12, 3),
    unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
    divergence_value NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDENTE', -- 'OK', 'DIVERGENTE', 'AJUSTADO'
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wh_inv_items_audit ON warehouse_inventory_audit_items(audit_id);

CREATE TABLE IF NOT EXISTS warehouse_inventory_scanned_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES warehouse_inventory_audits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES warehouse_products(id),
    serial_or_dot VARCHAR(60) NOT NULL,
    found_in_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wh_inv_scanned_audit ON warehouse_inventory_scanned_serials(audit_id);
