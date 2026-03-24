CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    email_domain VARCHAR(100),
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_active ON departments(is_active);
CREATE INDEX idx_departments_manager ON departments(manager_id);

-- Inserir departamentos padrão
INSERT INTO departments (name, description, email_domain) VALUES
('Administração', 'Departamento administrativo', 'admin'),
('Recursos Humanos', 'Gestão de pessoas', 'rh'),
('Financeiro', 'Gestão financeira', 'financeiro'),
('Operacional', 'Operações de campo', 'operacional'),
('Comercial', 'Vendas e marketing', 'comercial'),
('TI', 'Tecnologia da Informação', 'ti'); 