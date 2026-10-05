-- V4612: Adicionar campos de relatório de despesas / SIGLO à tabela invoices
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS expense_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS installment_seq INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS adjustment_amount NUMERIC(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bank_account_info VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_canceled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_invoices_expense_number ON invoices(expense_number);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_code ON invoices(supplier_code);
