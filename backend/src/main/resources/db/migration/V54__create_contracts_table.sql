CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    value DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    client_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_start_date ON contracts(start_date);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);

-- Comentários na tabela
COMMENT ON TABLE contracts IS 'Tabela para armazenar contratos com clientes';
COMMENT ON COLUMN contracts.id IS 'Identificador único do contrato';
COMMENT ON COLUMN contracts.contract_number IS 'Número do contrato';
COMMENT ON COLUMN contracts.description IS 'Descrição do contrato';
COMMENT ON COLUMN contracts.start_date IS 'Data de início do contrato';
COMMENT ON COLUMN contracts.end_date IS 'Data de término do contrato';
COMMENT ON COLUMN contracts.value IS 'Valor do contrato';
COMMENT ON COLUMN contracts.status IS 'Status do contrato (ACTIVE, INACTIVE, EXPIRED, SUSPENDED, PENDING, CANCELLED)';
COMMENT ON COLUMN contracts.notes IS 'Observações sobre o contrato';
COMMENT ON COLUMN contracts.client_id IS 'Referência ao cliente';
COMMENT ON COLUMN contracts.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN contracts.updated_at IS 'Data da última atualização'; 