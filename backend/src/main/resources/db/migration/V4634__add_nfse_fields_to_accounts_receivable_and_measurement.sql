-- Migration: V4634__add_nfse_fields_to_accounts_receivable_and_measurement.sql
-- Description: Adiciona campos de NFS-e, retenções de impostos e valores líquido/bruto em accounts_receivable e measurement_bulletins

ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(15, 2);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15, 2);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS issqn_retido NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS inss_retido NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS ir_retido NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS pis_retido NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS cofins_retido NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS csll_retido NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS ibs_cbs_amount NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS nfse_number VARCHAR(50);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS nfse_key VARCHAR(100);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS nfse_issue_date TIMESTAMP;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS nfse_xml_url VARCHAR(500);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS nfse_pdf_url VARCHAR(500);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS nfse_service_description TEXT;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS nfse_status VARCHAR(30) DEFAULT 'PENDENTE_NFSE';

ALTER TABLE measurement_bulletins ADD COLUMN IF NOT EXISTS nfse_number VARCHAR(50);
ALTER TABLE measurement_bulletins ADD COLUMN IF NOT EXISTS nfse_key VARCHAR(100);
ALTER TABLE measurement_bulletins ADD COLUMN IF NOT EXISTS nfse_pdf_url VARCHAR(500);
ALTER TABLE measurement_bulletins ADD COLUMN IF NOT EXISTS nfse_xml_url VARCHAR(500);
ALTER TABLE measurement_bulletins ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15, 2);
ALTER TABLE measurement_bulletins ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(15, 2);

CREATE INDEX IF NOT EXISTS idx_ar_nfse_number ON accounts_receivable(nfse_number);
CREATE INDEX IF NOT EXISTS idx_ar_nfse_key ON accounts_receivable(nfse_key);
