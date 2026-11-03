-- V4689: Adiciona campos de suporte a boletos bancários em PDF, NFS-e e conciliação em faturas (invoices)
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS linha_digitavel VARCHAR(60),
    ADD COLUMN IF NOT EXISTS boleto_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS boleto_original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nfe_pdf_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS is_nfse BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS divergence_alert TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_linha_digitavel ON invoices(linha_digitavel);
CREATE INDEX IF NOT EXISTS idx_invoices_boleto_url ON invoices(boleto_url);
