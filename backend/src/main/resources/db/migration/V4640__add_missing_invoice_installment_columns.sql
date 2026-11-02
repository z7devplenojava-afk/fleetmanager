-- Migration: V4640__add_missing_invoice_installment_columns.sql
-- Description: Adiciona colunas parent_invoice_id, total_installments e payment_method na tabela invoices

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parent_invoice_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_invoices_parent_invoice_id ON invoices(parent_invoice_id);
