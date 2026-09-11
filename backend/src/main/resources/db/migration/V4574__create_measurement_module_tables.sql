-- Migration V4574: Módulo de Geração e Gestão de Medições (PRD 1.0)

-- 1. Tabela de Contratos de Medição
CREATE TABLE IF NOT EXISTS measurement_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contract_number VARCHAR(100) NOT NULL,
    obra_name VARCHAR(255),
    description TEXT,
    billing_type VARCHAR(50) DEFAULT 'MENSAL',
    periodicity VARCHAR(50) DEFAULT 'MENSAL',
    base_days INT DEFAULT 30,
    start_day_of_month INT DEFAULT 21,
    end_day_of_month INT DEFAULT 20,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ATIVO',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Preços de Serviços por Contrato (com vigência)
CREATE TABLE IF NOT EXISTS measurement_contract_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES measurement_contracts(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100),
    service_name VARCHAR(150) NOT NULL,
    monthly_price NUMERIC(15, 2) DEFAULT 0.00,
    daily_price NUMERIC(15, 2) DEFAULT 0.00,
    km_extra_price NUMERIC(15, 2) DEFAULT 0.00,
    start_validity DATE NOT NULL,
    end_validity DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reajustes Contratuais
CREATE TABLE IF NOT EXISTS measurement_contract_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES measurement_contracts(id) ON DELETE CASCADE,
    percentage NUMERIC(8, 4) NOT NULL,
    index_name VARCHAR(100),
    applied_date DATE NOT NULL,
    previous_amount NUMERIC(15, 2) NOT NULL,
    new_amount NUMERIC(15, 2) NOT NULL,
    justification TEXT,
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Apontamento de Dias por Veículo na Medição
CREATE TABLE IF NOT EXISTS measurement_pointings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id UUID NOT NULL REFERENCES measurement_bulletins(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    days_expected NUMERIC(6, 2) DEFAULT 30.00,
    days_worked NUMERIC(6, 2) DEFAULT 0.00,
    days_stopped NUMERIC(6, 2) DEFAULT 0.00,
    stop_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cortes Financeiros por Manutenção/Parada
CREATE TABLE IF NOT EXISTS measurement_cuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id UUID NOT NULL REFERENCES measurement_bulletins(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    cut_days NUMERIC(6, 2) NOT NULL,
    cut_amount NUMERIC(15, 2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Excedentes (KM, Diárias e Viagens Adicionais)
CREATE TABLE IF NOT EXISTS measurement_surpluses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id UUID NOT NULL REFERENCES measurement_bulletins(id) ON DELETE CASCADE,
    surplus_type VARCHAR(50) NOT NULL, -- KM_EXCEDENTE, DIARIA_ADICIONAL, VIAGEM_ADICIONAL
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Descontos e Penalidades
CREATE TABLE IF NOT EXISTS measurement_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id UUID NOT NULL REFERENCES measurement_bulletins(id) ON DELETE CASCADE,
    discount_type VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Documentos Fiscais Vinculados (NFE e CTE)
CREATE TABLE IF NOT EXISTS measurement_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id UUID NOT NULL REFERENCES measurement_bulletins(id) ON DELETE CASCADE,
    invoice_type VARCHAR(20) NOT NULL, -- NFE, CTE
    number VARCHAR(50) NOT NULL,
    series VARCHAR(20),
    access_key VARCHAR(100),
    issue_date DATE,
    amount NUMERIC(15, 2) NOT NULL,
    issuer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'VINCULADO',
    xml_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Versionamento Imutável de Medições
CREATE TABLE IF NOT EXISTS measurement_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id UUID NOT NULL REFERENCES measurement_bulletins(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    snapshot_json JSONB NOT NULL,
    justification TEXT,
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_measurement_contracts_client ON measurement_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_measurement_contract_prices_contract ON measurement_contract_prices(contract_id);
CREATE INDEX IF NOT EXISTS idx_measurement_pointings_bulletin ON measurement_pointings(bulletin_id);
CREATE INDEX IF NOT EXISTS idx_measurement_cuts_bulletin ON measurement_cuts(bulletin_id);
CREATE INDEX IF NOT EXISTS idx_measurement_surpluses_bulletin ON measurement_surpluses(bulletin_id);
CREATE INDEX IF NOT EXISTS idx_measurement_discounts_bulletin ON measurement_discounts(bulletin_id);
CREATE INDEX IF NOT EXISTS idx_measurement_invoices_bulletin ON measurement_invoices(bulletin_id);
CREATE INDEX IF NOT EXISTS idx_measurement_versions_bulletin ON measurement_versions(bulletin_id);
