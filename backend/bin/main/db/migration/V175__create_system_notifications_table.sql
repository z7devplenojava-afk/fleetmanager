-- Create table system_notifications
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    recipient_id UUID,
    employee_name VARCHAR(200),
    client_name VARCHAR(200),
    contract_reference VARCHAR(100),
    value DECIMAL(15,2),
    department VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_system_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id),
    CONSTRAINT chk_system_notification_type CHECK (type IN ('NOVO_CLIENTE', 'CONTRATO_VENCENDO', 'FUNCIONARIO_ATRASADO', 'OCORRENCIA', 'ESCALA', 'ADVERTENCIA', 'NOVO_CONTRATO', 'LEAD_NOVO', 'PROPOSTA_ENVIADA', 'ORCAMENTO_APROVADO')),
    CONSTRAINT chk_system_notification_priority CHECK (priority IN ('BAIXA', 'MEDIA', 'ALTA'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_notification_recipient ON system_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_system_notification_type ON system_notifications(type);
CREATE INDEX IF NOT EXISTS idx_system_notification_priority ON system_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_system_notification_timestamp ON system_notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_notification_read ON system_notifications(read);
