-- Criação da tabela de contas a receber
CREATE TABLE IF NOT EXISTS accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    measurement_number VARCHAR(100),
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0.00,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    category VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    overdue_days INTEGER DEFAULT 0,
    late_fee DECIMAL(15,2) DEFAULT 0.00,
    late_penalty DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client_id ON accounts_receivable(client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_category ON accounts_receivable(category);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_payment_method ON accounts_receivable(payment_method);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_invoice_number ON accounts_receivable(invoice_number);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_created_at ON accounts_receivable(created_at);

-- Comentários para documentação
COMMENT ON TABLE accounts_receivable IS 'Tabela para gerenciar contas a receber dos clientes';
COMMENT ON COLUMN accounts_receivable.id IS 'Identificador único da conta a receber';
COMMENT ON COLUMN accounts_receivable.client_id IS 'Referência ao cliente';
COMMENT ON COLUMN accounts_receivable.invoice_number IS 'Número da fatura';
COMMENT ON COLUMN accounts_receivable.measurement_number IS 'Número da medição';
COMMENT ON COLUMN accounts_receivable.description IS 'Descrição da conta';
COMMENT ON COLUMN accounts_receivable.amount IS 'Valor total da conta';
COMMENT ON COLUMN accounts_receivable.amount_paid IS 'Valor já pago';
COMMENT ON COLUMN accounts_receivable.issue_date IS 'Data de emissão';
COMMENT ON COLUMN accounts_receivable.due_date IS 'Data de vencimento';
COMMENT ON COLUMN accounts_receivable.payment_date IS 'Data do pagamento';
COMMENT ON COLUMN accounts_receivable.status IS 'Status da conta (PENDING, PAID, OVERDUE, CANCELLED)';
COMMENT ON COLUMN accounts_receivable.category IS 'Categoria da conta (SERVICE, PRODUCT, OTHER)';
COMMENT ON COLUMN accounts_receivable.payment_method IS 'Método de pagamento (PIX, TRANSFER, CASH, CHECK)';
COMMENT ON COLUMN accounts_receivable.overdue_days IS 'Dias em atraso';
COMMENT ON COLUMN accounts_receivable.late_fee IS 'Taxa de atraso';
COMMENT ON COLUMN accounts_receivable.late_penalty IS 'Multa por atraso';
COMMENT ON COLUMN accounts_receivable.notes IS 'Observações adicionais';
