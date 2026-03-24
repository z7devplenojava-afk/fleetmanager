-- Create table operational_occurrences
CREATE TABLE IF NOT EXISTS operational_occurrences (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    employee_id UUID NOT NULL,
    location VARCHAR(200),
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    date TIMESTAMP NOT NULL,
    responsible VARCHAR(200),
    warning_number INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_operational_occurrence_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT chk_operational_occurrence_type CHECK (type IN ('SEGURANCA', 'DISCIPLINAR', 'EQUIPAMENTO', 'INCIDENTE', 'MANUTENCAO')),
    CONSTRAINT chk_operational_occurrence_status CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'RESOLVIDO', 'CONCLUIDO')),
    CONSTRAINT chk_operational_occurrence_priority CHECK (priority IN ('BAIXA', 'MEDIA', 'ALTA'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_operational_occurrence_employee ON operational_occurrences(employee_id);
CREATE INDEX IF NOT EXISTS idx_operational_occurrence_type ON operational_occurrences(type);
CREATE INDEX IF NOT EXISTS idx_operational_occurrence_status ON operational_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_operational_occurrence_priority ON operational_occurrences(priority);
CREATE INDEX IF NOT EXISTS idx_operational_occurrence_date ON operational_occurrences(date);
