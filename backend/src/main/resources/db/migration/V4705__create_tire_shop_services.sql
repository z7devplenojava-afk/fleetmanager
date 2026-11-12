-- Catalogo de tipos de servicos de borracharia e registros de servicos externos/borracharia integrados ao Contas a Pagar (invoices)

CREATE TABLE IF NOT EXISTS tire_shop_service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    code VARCHAR(40),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    default_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    requires_pickup BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tire_shop_catalog_company ON tire_shop_service_catalog(company_id, active);

-- Servicos padrao globais (company_id NULL) disponiveis para todas as empresas
INSERT INTO tire_shop_service_catalog (id, company_id, code, name, description, default_price, requires_pickup, active)
SELECT gen_random_uuid(), NULL, 'BOR-001', 'Recapagem / Reforma Completa de Carcaça', 'Recapagem completa com banda de rodagem nova e envio/coleta pela recapadora', 0, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tire_shop_service_catalog WHERE company_id IS NULL AND code = 'BOR-001');

INSERT INTO tire_shop_service_catalog (id, company_id, code, name, description, default_price, requires_pickup, active)
SELECT gen_random_uuid(), NULL, 'BOR-002', 'Vulcanização / Conserto Estrutural', 'Reparo vulcanizado a quente ou frio na banda/ombro/lateral do pneu', 0, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tire_shop_service_catalog WHERE company_id IS NULL AND code = 'BOR-002');

INSERT INTO tire_shop_service_catalog (id, company_id, code, name, description, default_price, requires_pickup, active)
SELECT gen_random_uuid(), NULL, 'BOR-003', 'Troca / Montagem e Desmontagem de Pneu', 'Mão de obra de montagem, desmontagem e substituição em eixo', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tire_shop_service_catalog WHERE company_id IS NULL AND code = 'BOR-003');

INSERT INTO tire_shop_service_catalog (id, company_id, code, name, description, default_price, requires_pickup, active)
SELECT gen_random_uuid(), NULL, 'BOR-004', 'Reparo de Câmara, Bico e Válvula', 'Substituição ou conserto de câmara de ar, protetor, bico e válvula', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tire_shop_service_catalog WHERE company_id IS NULL AND code = 'BOR-004');

INSERT INTO tire_shop_service_catalog (id, company_id, code, name, description, default_price, requires_pickup, active)
SELECT gen_random_uuid(), NULL, 'BOR-005', 'Rodízio e Calibragem de Eixos', 'Rodízio técnico de posições no chassi e aferição de calibragem', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tire_shop_service_catalog WHERE company_id IS NULL AND code = 'BOR-005');

INSERT INTO tire_shop_service_catalog (id, company_id, code, name, description, default_price, requires_pickup, active)
SELECT gen_random_uuid(), NULL, 'BOR-006', 'Alinhamento e Balanceamento Externo', 'Serviço de alinhamento geométrico e balanceamento de rodado em terceiros', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tire_shop_service_catalog WHERE company_id IS NULL AND code = 'BOR-006');

CREATE TABLE IF NOT EXISTS tire_shop_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    service_number VARCHAR(40) NOT NULL,
    catalog_service_id UUID REFERENCES tire_shop_service_catalog(id) ON DELETE SET NULL,
    service_name VARCHAR(200) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    supplier_name VARCHAR(200),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    tire_ids_json TEXT,
    tire_labels_summary VARCHAR(500),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    service_date DATE NOT NULL,
    due_date DATE,
    boleto_url TEXT,
    boleto_original_name VARCHAR(255),
    linha_digitavel VARCHAR(100),
    barcode VARCHAR(255),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    invoice_number VARCHAR(60),
    generate_payable BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_by_user_id UUID,
    created_by_name VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tire_shop_services_company ON tire_shop_services(company_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_tire_shop_services_supplier ON tire_shop_services(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tire_shop_services_invoice ON tire_shop_services(invoice_id);
CREATE INDEX IF NOT EXISTS idx_tire_shop_services_vehicle ON tire_shop_services(vehicle_id);

