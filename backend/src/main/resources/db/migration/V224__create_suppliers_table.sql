CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    category VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_cnpj ON suppliers(cnpj);
CREATE INDEX idx_suppliers_email ON suppliers(email);
CREATE INDEX idx_suppliers_city ON suppliers(city);
CREATE INDEX idx_suppliers_state ON suppliers(state);
CREATE INDEX idx_suppliers_category ON suppliers(category);
CREATE INDEX idx_suppliers_active ON suppliers(is_active); 