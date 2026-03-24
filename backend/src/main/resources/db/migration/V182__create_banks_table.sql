-- Criação da tabela de bancos
CREATE TABLE banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20),
    cnpj VARCHAR(20),
    description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    website VARCHAR(100),
    phone VARCHAR(20),
    address VARCHAR(200),
    city VARCHAR(50),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX idx_banks_code ON banks(code);
CREATE INDEX idx_banks_name ON banks(name);
CREATE INDEX idx_banks_status ON banks(status);
CREATE INDEX idx_banks_state ON banks(state);

-- Inserir dados iniciais de bancos brasileiros
INSERT INTO banks (code, name, short_name, cnpj, status, website, city, state) VALUES
('001', 'Banco do Brasil S.A.', 'BB', '00000000000191', 'ACTIVE', 'www.bb.com.br', 'Brasília', 'DF'),
('033', 'Banco Santander (Brasil) S.A.', 'Santander', '90400888000142', 'ACTIVE', 'www.santander.com.br', 'São Paulo', 'SP'),
('104', 'Caixa Econômica Federal', 'CEF', '00360305000104', 'ACTIVE', 'www.caixa.gov.br', 'Brasília', 'DF'),
('237', 'Banco Bradesco S.A.', 'Bradesco', '60746948000112', 'ACTIVE', 'www.bradesco.com.br', 'Osasco', 'SP'),
('341', 'Banco Itaú Unibanco S.A.', 'Itaú', '60701190000104', 'ACTIVE', 'www.itau.com.br', 'São Paulo', 'SP'),
('422', 'Banco Safra S.A.', 'Safra', '58160789000128', 'ACTIVE', 'www.safra.com.br', 'São Paulo', 'SP'),
('748', 'Banco Cooperativo Sicredi S.A.', 'Sicredi', '01180653000157', 'ACTIVE', 'www.sicredi.com.br', 'Porto Alegre', 'RS'),
('756', 'Banco Cooperativo do Brasil S.A.', 'Sicoob', '02038232000164', 'ACTIVE', 'www.sicoob.com.br', 'Brasília', 'DF'),
('260', 'Nu Pagamentos S.A.', 'Nubank', '18236120000158', 'ACTIVE', 'www.nubank.com.br', 'São Paulo', 'SP'),
('336', 'Banco C6 S.A.', 'C6 Bank', '31872495000100', 'ACTIVE', 'www.c6bank.com.br', 'São Paulo', 'SP');
