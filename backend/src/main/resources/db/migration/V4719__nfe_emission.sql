-- =====================================================================
-- NF-e modelo 55 (versão 4.00) — emissão, protocolo e espelho fiscal
-- =====================================================================

CREATE TABLE IF NOT EXISTS electronic_nfes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    fiscal_document_id UUID,
    number VARCHAR(20) NOT NULL,
    series VARCHAR(10) NOT NULL,
    access_key VARCHAR(44) NOT NULL,
    status VARCHAR(20) NOT NULL,
    environment VARCHAR(1) NOT NULL DEFAULT '2',
    emission_date TIMESTAMP NOT NULL,

    nature_operation VARCHAR(120) NOT NULL,
    tp_nf VARCHAR(1) NOT NULL DEFAULT '1',
    id_dest VARCHAR(1) NOT NULL DEFAULT '1',
    tp_imp VARCHAR(1) NOT NULL DEFAULT '1',
    tp_emis VARCHAR(1) NOT NULL DEFAULT '1',
    fin_nfe VARCHAR(1) NOT NULL DEFAULT '1',
    ind_final VARCHAR(1) NOT NULL DEFAULT '1',
    ind_pres VARCHAR(1) NOT NULL DEFAULT '1',
    proc_emi VARCHAR(1) NOT NULL DEFAULT '0',
    ver_proc VARCHAR(20) NOT NULL DEFAULT 'FleetManager',

    issuer_name VARCHAR(200) NOT NULL,
    issuer_tax_id VARCHAR(20) NOT NULL,
    issuer_state_registration VARCHAR(20),
    issuer_state VARCHAR(2),
    issuer_city VARCHAR(120),
    issuer_municipality_code VARCHAR(7),
    issuer_address VARCHAR(255),
    issuer_address_number VARCHAR(20),
    issuer_neighborhood VARCHAR(100),
    issuer_zip VARCHAR(12),
    issuer_phone VARCHAR(30),
    issuer_email VARCHAR(120),
    issuer_crt VARCHAR(1) NOT NULL DEFAULT '3',

    recipient_name VARCHAR(200),
    recipient_tax_id VARCHAR(20),
    recipient_state_registration VARCHAR(20),
    recipient_ind_iedest VARCHAR(1),
    recipient_email VARCHAR(120),
    recipient_address VARCHAR(255),
    recipient_address_number VARCHAR(20),
    recipient_neighborhood VARCHAR(100),
    recipient_city VARCHAR(120),
    recipient_state VARCHAR(2),
    recipient_zip VARCHAR(12),
    recipient_municipality_code VARCHAR(7),

    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    icms_base NUMERIC(15, 2) NOT NULL DEFAULT 0,
    icms_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    pis_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cofins_value NUMERIC(15, 2) NOT NULL DEFAULT 0,

    payment_type VARCHAR(2) NOT NULL DEFAULT '15',
    payment_ind VARCHAR(1) NOT NULL DEFAULT '0',
    freight_modality VARCHAR(1) NOT NULL DEFAULT '9',
    resp_tech_cnpj VARCHAR(14),
    resp_tech_contact VARCHAR(60),
    resp_tech_email VARCHAR(60),
    resp_tech_phone VARCHAR(14),

    protocol_number VARCHAR(20),
    protocol_status VARCHAR(10),
    protocol_message TEXT,
    signed_xml TEXT,
    response_xml TEXT,
    rejection_code VARCHAR(20),
    rejection_message TEXT,
    certificate_id UUID,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_electronic_nfes_access_key ON electronic_nfes(access_key);
CREATE UNIQUE INDEX IF NOT EXISTS uk_electronic_nfes_number ON electronic_nfes(company_id, series, number);
CREATE INDEX IF NOT EXISTS idx_electronic_nfes_company ON electronic_nfes(company_id, emission_date DESC);
CREATE INDEX IF NOT EXISTS idx_electronic_nfes_fiscal_document ON electronic_nfes(fiscal_document_id);

CREATE TABLE IF NOT EXISTS electronic_nfe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nfe_id UUID NOT NULL REFERENCES electronic_nfes(id) ON DELETE CASCADE,
    item_number INTEGER NOT NULL,
    code VARCHAR(60) NOT NULL,
    description VARCHAR(120) NOT NULL,
    ncm VARCHAR(8) NOT NULL,
    cfop VARCHAR(4) NOT NULL,
    unit VARCHAR(6) NOT NULL,
    quantity NUMERIC(15, 4) NOT NULL,
    unit_value NUMERIC(15, 10) NOT NULL,
    total_value NUMERIC(15, 2) NOT NULL,

    icms_orig VARCHAR(1) NOT NULL DEFAULT '0',
    icms_cst VARCHAR(2) NOT NULL DEFAULT '00',
    icms_base NUMERIC(15, 2) NOT NULL DEFAULT 0,
    icms_rate NUMERIC(7, 4) NOT NULL DEFAULT 0,
    icms_value NUMERIC(15, 2) NOT NULL DEFAULT 0,

    pis_cst VARCHAR(2) NOT NULL DEFAULT '01',
    pis_base NUMERIC(15, 2) NOT NULL DEFAULT 0,
    pis_rate NUMERIC(7, 4) NOT NULL DEFAULT 0,
    pis_value NUMERIC(15, 2) NOT NULL DEFAULT 0,

    cofins_cst VARCHAR(2) NOT NULL DEFAULT '01',
    cofins_base NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cofins_rate NUMERIC(7, 4) NOT NULL DEFAULT 0,
    cofins_value NUMERIC(15, 2) NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_electronic_nfe_items_number ON electronic_nfe_items(nfe_id, item_number);
CREATE INDEX IF NOT EXISTS idx_electronic_nfe_items_nfe ON electronic_nfe_items(nfe_id);

COMMENT ON TABLE electronic_nfes IS 'NF-e 4.00 emitidas pelo FleetManager (modelo 55)';
COMMENT ON COLUMN electronic_nfes.access_key IS 'Chave de acesso de 44 dígitos (módulo 11)';
COMMENT ON COLUMN electronic_nfes.protocol_number IS 'nProt retornado pela SEFAZ no protNFe/infProt';
