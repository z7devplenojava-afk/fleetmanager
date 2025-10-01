-- Criação da tabela de pagamentos agendados
CREATE TABLE IF NOT EXISTS scheduled_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    scheduled_date DATE NOT NULL,
    execution_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    payment_method VARCHAR(20) NOT NULL,
    invoice_number VARCHAR(100),
    notes TEXT,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_client_id ON scheduled_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_scheduled_date ON scheduled_payments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_status ON scheduled_payments(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_payment_method ON scheduled_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_alert_sent ON scheduled_payments(alert_sent);
