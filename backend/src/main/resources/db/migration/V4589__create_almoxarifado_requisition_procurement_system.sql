-- Migration: V4589__create_almoxarifado_requisition_procurement_system.sql
-- Description: Módulo completo de Requisição ao Almoxarifado, Reserva de Peças por OS, Cotações Triplas, Ordem de Compra e Entrada de NF-e com SLA

-- 1. Tabela de Requisições de Material / Solicitações de Compra
CREATE TABLE IF NOT EXISTS material_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    requisition_number VARCHAR(50) NOT NULL,
    work_order_id UUID REFERENCES fleet_work_orders(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    unit VARCHAR(20) DEFAULT 'UN',
    urgency VARCHAR(30) NOT NULL DEFAULT 'NORMAL', -- NORMAL, EMERGENCIA
    justification TEXT NOT NULL,
    requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
    requester_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_CHECK', 
    -- PENDING_CHECK, RESERVED_STOCK, WAITING_QUOTES, QUOTES_RECEIVED, APPROVED_BY_MANAGER, OC_GENERATED, WAITING_DELIVERY, AVAILABLE_FOR_INSTALLATION, INSTALLED_COMPLETED, REJECTED, CANCELLED
    manager_approval_id UUID REFERENCES users(id) ON DELETE SET NULL,
    manager_approval_name VARCHAR(255),
    manager_approval_date TIMESTAMP,
    rejection_reason TEXT,
    released_at TIMESTAMP,
    sla_lead_time_minutes BIGINT,
    sla_target_minutes BIGINT DEFAULT 4320, -- Default 72h (4320 min) / Emergência 4h-24h (240-1440 min)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_req_company ON material_requisitions(company_id);
CREATE INDEX IF NOT EXISTS idx_material_req_wo ON material_requisitions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_material_req_vehicle ON material_requisitions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_material_req_status ON material_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_material_req_urgency ON material_requisitions(urgency);

-- 2. Tabela de Reserva de Estoque por OS e Veículo
CREATE TABLE IF NOT EXISTS stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES fleet_work_orders(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    requisition_id UUID REFERENCES material_requisitions(id) ON DELETE SET NULL,
    quantity_reserved NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE_RESERVED', -- ACTIVE_RESERVED, READY_FOR_INSTALLATION, CONSUMED, CANCELLED
    reserved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reserved_by_name VARCHAR(255),
    reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_stock_res_company ON stock_reservations(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_item ON stock_reservations(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_wo ON stock_reservations(work_order_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_status ON stock_reservations(status);

-- 3. Tabela Comparativa de 3 Cotações
CREATE TABLE IF NOT EXISTS procurement_quote_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    requisition_id UUID NOT NULL REFERENCES material_requisitions(id) ON DELETE CASCADE,
    comparison_number VARCHAR(50) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'IN_QUOTATION', -- IN_QUOTATION, READY_FOR_EVALUATION, APPROVED, REJECTED
    system_recommended_option_id UUID,
    system_recommendation_reason TEXT,
    chosen_option_id UUID,
    override_reason TEXT,
    approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by_name VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_quote_comp_req ON procurement_quote_comparisons(requisition_id);
CREATE INDEX IF NOT EXISTS idx_proc_quote_comp_company ON procurement_quote_comparisons(company_id);

-- 4. Tabela de Opções Individuais de Cotação (Fornecedor 1, 2, 3)
CREATE TABLE IF NOT EXISTS procurement_quote_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID NOT NULL REFERENCES procurement_quote_comparisons(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_cnpj VARCHAR(20),
    supplier_contact VARCHAR(100),
    supplier_phone VARCHAR(50),
    unit_price NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    payment_terms VARCHAR(100) NOT NULL, -- À VISTA, 30 DIAS, 30/60 DIAS, 30/60/90 DIAS, ETC
    payment_term_days INTEGER DEFAULT 0, -- 0, 30, 60, 90
    delivery_time_days INTEGER NOT NULL DEFAULT 1, -- Prazo em dias
    shipping_cost NUMERIC(15, 2) DEFAULT 0.00,
    warranty_months INTEGER DEFAULT 3,
    is_winner BOOLEAN DEFAULT FALSE,
    proposal_attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_quote_opt_comp ON procurement_quote_options(comparison_id);

-- 5. Tabela de Ordens de Compra (OC) para o Financeiro
CREATE TABLE IF NOT EXISTS procurement_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    oc_number VARCHAR(50) NOT NULL,
    requisition_id UUID NOT NULL REFERENCES material_requisitions(id) ON DELETE RESTRICT,
    comparison_id UUID REFERENCES procurement_quote_comparisons(id) ON DELETE SET NULL,
    winning_quote_option_id UUID REFERENCES procurement_quote_options(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_cnpj VARCHAR(20),
    supplier_contact VARCHAR(100),
    supplier_phone VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_terms VARCHAR(100) NOT NULL,
    delivery_estimated_date DATE,
    urgency VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    justification TEXT NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING_FINANCIAL_APPROVAL',
    -- PENDING_FINANCIAL_APPROVAL, FINANCIAL_APPROVED, PURCHASED_IN_TRANSIT, DELIVERED_IN_ALMOXARIFADO, CANCELLED
    financial_approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    financial_approved_by_name VARCHAR(255),
    financial_approved_at TIMESTAMP,
    financial_notes TEXT,
    invoice_number VARCHAR(100),
    invoice_key VARCHAR(100),
    invoice_received_at TIMESTAMP,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_po_company ON procurement_purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_proc_po_req ON procurement_purchase_orders(requisition_id);
CREATE INDEX IF NOT EXISTS idx_proc_po_status ON procurement_purchase_orders(status);

-- 6. Tabela de Lançamento de Notas Fiscais de Entrada no Almoxarifado
CREATE TABLE IF NOT EXISTS stock_invoice_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES procurement_purchase_orders(id) ON DELETE SET NULL,
    requisition_id UUID REFERENCES material_requisitions(id) ON DELETE SET NULL,
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_series VARCHAR(20),
    invoice_key VARCHAR(100),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_cnpj VARCHAR(20),
    issue_date DATE,
    entry_date TIMESTAMP NOT NULL DEFAULT NOW(),
    quantity_received NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
    total_invoice_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
    received_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    received_by_name VARCHAR(255),
    entry_type VARCHAR(50) NOT NULL DEFAULT 'PURCHASE_ORDER', -- PURCHASED_ORDER, MANUAL_ENTRY, XML_IMPORT
    is_released_to_work_order BOOLEAN DEFAULT TRUE,
    lead_time_minutes BIGINT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_inv_ent_company ON stock_invoice_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_inv_ent_po ON stock_invoice_entries(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_stock_inv_ent_req ON stock_invoice_entries(requisition_id);
