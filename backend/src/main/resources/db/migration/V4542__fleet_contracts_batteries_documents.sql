-- ============================================================
-- V4542: Contratos com tipo, documentos do contrato,
--        baterias de veículos e documentos do veículo (CRLV/DUT/Seguro)
-- ============================================================

-- 1) Tipo do contrato (Arrendamento, Locação de Veículos, etc.)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(40);

-- 2) Documentos anexados ao contrato
CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(120),
    uploaded_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_documents_contract ON contract_documents(contract_id);

-- 3) Baterias dos veículos
CREATE TABLE IF NOT EXISTS vehicle_batteries (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    battery_code VARCHAR(60),
    brand VARCHAR(60),
    model VARCHAR(60),
    voltage VARCHAR(20),
    capacity VARCHAR(30),
    install_date DATE,
    warranty_expiry_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    cost NUMERIC(12, 2),
    notes TEXT,
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_batteries_vehicle ON vehicle_batteries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_batteries_status ON vehicle_batteries(status);

-- 4) Documentos do veículo (CRLV, DUT, Seguro, Outros)
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    doc_type VARCHAR(30) NOT NULL,
    title VARCHAR(150),
    document_number VARCHAR(60),
    issue_date DATE,
    expiry_date DATE,
    stored_path TEXT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(120),
    uploaded_by UUID,
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_type ON vehicle_documents(doc_type);
