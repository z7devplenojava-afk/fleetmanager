CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_cnpj ON clients(cnpj);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_contact_email ON clients(contact_email);

-- Comentários na tabela
COMMENT ON TABLE clients IS 'Tabela para armazenar dados dos clientes';
COMMENT ON COLUMN clients.id IS 'Identificador único do cliente';
COMMENT ON COLUMN clients.name IS 'Nome da empresa cliente';
COMMENT ON COLUMN clients.cnpj IS 'CNPJ da empresa cliente';
COMMENT ON COLUMN clients.email IS 'Email principal da empresa';
COMMENT ON COLUMN clients.phone IS 'Telefone fixo da empresa';
COMMENT ON COLUMN clients.mobile IS 'Telefone celular da empresa';
COMMENT ON COLUMN clients.address IS 'Endereço completo da empresa';
COMMENT ON COLUMN clients.city IS 'Cidade da empresa';
COMMENT ON COLUMN clients.state IS 'Estado da empresa (UF)';
COMMENT ON COLUMN clients.zip_code IS 'CEP da empresa';
COMMENT ON COLUMN clients.contact_name IS 'Nome do contato principal';
COMMENT ON COLUMN clients.contact_email IS 'Email do contato principal';
COMMENT ON COLUMN clients.contact_phone IS 'Telefone do contato principal';
COMMENT ON COLUMN clients.status IS 'Status do cliente (ACTIVE, INACTIVE, SUSPENDED, PENDING)';
COMMENT ON COLUMN clients.notes IS 'Observações sobre o cliente';
COMMENT ON COLUMN clients.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN clients.updated_at IS 'Data da última atualização'; 