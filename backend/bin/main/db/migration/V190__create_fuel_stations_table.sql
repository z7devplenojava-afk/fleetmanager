-- Criar tabela de postos de combustível
CREATE TABLE IF NOT EXISTS fuel_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    brand VARCHAR(100),
    manager VARCHAR(255),
    manager_phone VARCHAR(20),
    manager_email VARCHAR(255),
    operating_hours VARCHAR(200),
    services TEXT,
    payment_methods TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fuel_stations_name ON fuel_stations(name);
CREATE INDEX IF NOT EXISTS idx_fuel_stations_city ON fuel_stations(city);
CREATE INDEX IF NOT EXISTS idx_fuel_stations_state ON fuel_stations(state);
CREATE INDEX IF NOT EXISTS idx_fuel_stations_brand ON fuel_stations(brand);
CREATE INDEX IF NOT EXISTS idx_fuel_stations_status ON fuel_stations(status);
CREATE INDEX IF NOT EXISTS idx_fuel_stations_cnpj ON fuel_stations(cnpj);

-- Criar índice espacial para busca por proximidade
CREATE INDEX IF NOT EXISTS idx_fuel_stations_coordinates ON fuel_stations(latitude, longitude);

-- Comentários para documentar a tabela
COMMENT ON TABLE fuel_stations IS 'Tabela para armazenar informações dos postos de combustível';
COMMENT ON COLUMN fuel_stations.id IS 'Identificador único do posto';
COMMENT ON COLUMN fuel_stations.name IS 'Nome do posto de combustível';
COMMENT ON COLUMN fuel_stations.address IS 'Endereço completo do posto';
COMMENT ON COLUMN fuel_stations.city IS 'Cidade onde está localizado o posto';
COMMENT ON COLUMN fuel_stations.state IS 'Estado onde está localizado o posto';
COMMENT ON COLUMN fuel_stations.zip_code IS 'CEP do endereço do posto';
COMMENT ON COLUMN fuel_stations.phone IS 'Telefone principal do posto';
COMMENT ON COLUMN fuel_stations.email IS 'Email de contato do posto';
COMMENT ON COLUMN fuel_stations.cnpj IS 'CNPJ do posto (formato: 00.000.000/0000-00)';
COMMENT ON COLUMN fuel_stations.brand IS 'Marca/bandeira do posto (ex: Petrobras, Shell, etc.)';
COMMENT ON COLUMN fuel_stations.manager IS 'Nome do gerente do posto';
COMMENT ON COLUMN fuel_stations.manager_phone IS 'Telefone do gerente';
COMMENT ON COLUMN fuel_stations.manager_email IS 'Email do gerente';
COMMENT ON COLUMN fuel_stations.operating_hours IS 'Horário de funcionamento do posto';
COMMENT ON COLUMN fuel_stations.services IS 'Serviços oferecidos (lavagem, conveniência, etc.)';
COMMENT ON COLUMN fuel_stations.payment_methods IS 'Formas de pagamento aceitas';
COMMENT ON COLUMN fuel_stations.latitude IS 'Latitude para localização GPS';
COMMENT ON COLUMN fuel_stations.longitude IS 'Longitude para localização GPS';
COMMENT ON COLUMN fuel_stations.status IS 'Status do posto (ACTIVE, INACTIVE, MAINTENANCE, CLOSED)';
COMMENT ON COLUMN fuel_stations.notes IS 'Observações adicionais sobre o posto';
COMMENT ON COLUMN fuel_stations.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN fuel_stations.updated_at IS 'Data e hora da última atualização';

-- Inserir alguns postos de exemplo
INSERT INTO fuel_stations (name, address, city, state, zip_code, phone, brand, status) VALUES
('Posto Petrobras Centro', 'Rua das Flores, 123 - Centro', 'São Paulo', 'SP', '01234-567', '(11) 3333-4444', 'Petrobras', 'ACTIVE'),
('Posto Shell Marginal', 'Av. Marginal Tietê, 500 - Vila Madalena', 'São Paulo', 'SP', '05433-000', '(11) 5555-6666', 'Shell', 'ACTIVE'),
('Posto Ipiranga Shopping', 'Rua do Comércio, 789 - Shopping Center', 'São Paulo', 'SP', '04567-890', '(11) 7777-8888', 'Ipiranga', 'ACTIVE'),
('Posto BR Norte', 'Av. Paulista, 1000 - Bela Vista', 'São Paulo', 'SP', '01310-100', '(11) 9999-0000', 'BR', 'ACTIVE'),
('Posto Texaco Sul', 'Rua Augusta, 456 - Consolação', 'São Paulo', 'SP', '01234-567', '(11) 1111-2222', 'Texaco', 'ACTIVE')
ON CONFLICT (name) DO NOTHING;
