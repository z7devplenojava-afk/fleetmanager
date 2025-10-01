-- Migration para adicionar campos avançados à tabela financial_transactions
ALTER TABLE financial_transactions ADD COLUMN expense_type VARCHAR(20);
ALTER TABLE financial_transactions ADD COLUMN cost_center VARCHAR(100);
ALTER TABLE financial_transactions ADD COLUMN barcode VARCHAR(255);
ALTER TABLE financial_transactions ADD COLUMN receipt_url VARCHAR(500);
ALTER TABLE financial_transactions ADD COLUMN supplier_id UUID;
ALTER TABLE financial_transactions ADD CONSTRAINT fk_financial_transactions_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
CREATE INDEX idx_financial_transactions_expense_type ON financial_transactions(expense_type);
CREATE INDEX idx_financial_transactions_cost_center ON financial_transactions(cost_center);
CREATE INDEX idx_financial_transactions_supplier_id ON financial_transactions(supplier_id);