-- V4650: Criação da tabela de Histórico de Funcionários
CREATE TABLE IF NOT EXISTS employee_history (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(40) NOT NULL,
    event_date DATE NOT NULL,
    description TEXT NOT NULL,
    related_document_url TEXT,
    created_by VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_employee_history_employee ON employee_history(employee_id);
