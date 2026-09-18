-- Migration: V4590__enhance_purchase_orders_payment_programming.sql
-- Description: Campos de programação de pagamento na Ordem de Compra (Cartão de Crédito/Débito, Parcelas, PIX, Boleto, Transferência)

ALTER TABLE procurement_purchase_orders 
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS installments_count INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS card_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS card_flag VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_scheduled_date DATE,
    ADD COLUMN IF NOT EXISTS payment_due_date DATE,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING_PROGRAMMING',
    ADD COLUMN IF NOT EXISTS installment_details TEXT,
    ADD COLUMN IF NOT EXISTS financial_programmed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS financial_programmed_by_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS financial_programmed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_proc_po_pay_method ON procurement_purchase_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_proc_po_card_number ON procurement_purchase_orders(card_number);
CREATE INDEX IF NOT EXISTS idx_proc_po_pay_status ON procurement_purchase_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_proc_po_sched_date ON procurement_purchase_orders(payment_scheduled_date);
