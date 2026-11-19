-- =====================================================================
-- NFS-e Nacional: emissão de DPS, certificado digital A1 e dados fiscais
-- =====================================================================

-- Dados fiscais da empresa usados na geração da DPS
ALTER TABLE companies ADD COLUMN IF NOT EXISTS codigo_municipio VARCHAR(7);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(2);

COMMENT ON COLUMN companies.codigo_municipio IS 'Código IBGE do município emissor (7 dígitos)';
COMMENT ON COLUMN companies.regime_tributario IS 'Situação perante o Simples Nacional: 1=Não optante, 2=MEI, 3=ME/EPP';

-- Certificados digitais A1 (PKCS#12) por empresa
CREATE TABLE IF NOT EXISTS fiscal_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    alias VARCHAR(120),
    file_name VARCHAR(255),
    subject VARCHAR(500),
    cnpj VARCHAR(14),
    serial_number VARCHAR(120),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    encrypted_pfx BYTEA NOT NULL,
    pfx_iv BYTEA NOT NULL,
    encrypted_password BYTEA NOT NULL,
    password_iv BYTEA NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fiscal_certificates_company ON fiscal_certificates(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_fiscal_certificates_active
    ON fiscal_certificates(company_id) WHERE active = TRUE;

-- Campos de emissão da NFS-e
ALTER TABLE service_invoices ALTER COLUMN verification_code TYPE VARCHAR(50);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS dps_number BIGINT;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS dps_id VARCHAR(45);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS nfse_key VARCHAR(50);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS environment VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS municipality_code VARCHAR(7);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS service_location_code VARCHAR(7);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS taker_municipal_registration VARCHAR(20);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS taker_address_number VARCHAR(20);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS taker_neighborhood VARCHAR(100);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS taker_municipality_code VARCHAR(7);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS municipal_tax_code VARCHAR(20);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS nbs_code VARCHAR(9);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS iss_taxation VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS iss_withholding_type VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS op_simp_nac VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS reg_esp_trib VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS inss_amount NUMERIC(15, 2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS irrf_amount NUMERIC(15, 2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS csll_amount NUMERIC(15, 2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS iss_retained_amount NUMERIC(15, 2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS signed_xml TEXT;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS response_xml TEXT;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS rejection_code VARCHAR(20);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS rejection_message TEXT;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS certificate_id UUID;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_service_invoices_dps
    ON service_invoices(company_id, series, dps_number) WHERE dps_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_invoices_nfse_key ON service_invoices(nfse_key);
CREATE INDEX IF NOT EXISTS idx_service_invoices_certificate ON service_invoices(certificate_id);
