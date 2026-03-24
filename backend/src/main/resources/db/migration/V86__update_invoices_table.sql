-- Adicionar novos campos à tabela invoices
ALTER TABLE invoices 
ADD COLUMN type VARCHAR(20) DEFAULT 'VARIAVEL',
ADD COLUMN category VARCHAR(100),
ADD COLUMN barcode VARCHAR(255),
ADD COLUMN baixa VARCHAR(255),
ADD COLUMN supplier_id UUID;

-- Adicionar foreign keys
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Índices para melhorar performance
CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_category ON invoices(category);
CREATE INDEX idx_invoices_barcode ON invoices(barcode);
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_status_type ON invoices(status, type);
CREATE INDEX idx_invoices_due_date_status ON invoices(due_date, status); 