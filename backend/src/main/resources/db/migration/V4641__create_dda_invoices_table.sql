-- Migration: V4641__create_dda_invoices_table.sql
-- Description: Cria a tabela dda_invoices para integração e conciliação bancária DDA

CREATE TABLE IF NOT EXISTS dda_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    barcode VARCHAR(255),
    linha_digitavel VARCHAR(255),
    issuer_cnpj VARCHAR(20),
    issuer_name VARCHAR(255),
    payer_cnpj VARCHAR(20),
    payer_name VARCHAR(255),
    amount NUMERIC(15, 2),
    due_date DATE,
    issue_date DATE,
    status VARCHAR(30) DEFAULT 'DETECTED',
    linked_invoice_id UUID,
    transaction_id VARCHAR(100),
    synced_at TIMESTAMP WITHOUT TIME ZONE,
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dda_invoices_company_id ON dda_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_dda_invoices_barcode ON dda_invoices(barcode);
CREATE INDEX IF NOT EXISTS idx_dda_invoices_status ON dda_invoices(status);
CREATE INDEX IF NOT EXISTS idx_dda_invoices_due_date ON dda_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_dda_invoices_linked_invoice ON dda_invoices(linked_invoice_id);
