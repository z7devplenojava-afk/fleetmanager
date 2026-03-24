-- Tabela de Médicos
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    crm_number VARCHAR(20) NOT NULL,
    crm_state VARCHAR(2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_doctors_crm UNIQUE (crm_number, crm_state)
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(active);



