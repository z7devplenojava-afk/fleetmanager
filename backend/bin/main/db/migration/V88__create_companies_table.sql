-- Criação da tabela companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    description VARCHAR(1000),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    type VARCHAR(50),
    sector VARCHAR(100),
    size VARCHAR(50),
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_companies_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_companies_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_cnpj ON companies(cnpj);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_state ON companies(state);
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_companies_type ON companies(type);
CREATE INDEX idx_companies_size ON companies(size);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Comentários na tabela
COMMENT ON TABLE companies IS 'Tabela para armazenar dados das empresas';
COMMENT ON COLUMN companies.id IS 'ID único da empresa';
COMMENT ON COLUMN companies.name IS 'Nome da empresa';
COMMENT ON COLUMN companies.trade_name IS 'Nome fantasia da empresa';
COMMENT ON COLUMN companies.cnpj IS 'CNPJ da empresa';
COMMENT ON COLUMN companies.inscricao_estadual IS 'Inscrição estadual';
COMMENT ON COLUMN companies.inscricao_municipal IS 'Inscrição municipal';
COMMENT ON COLUMN companies.address IS 'Endereço completo';
COMMENT ON COLUMN companies.city IS 'Cidade';
COMMENT ON COLUMN companies.state IS 'Estado (UF)';
COMMENT ON COLUMN companies.zip_code IS 'CEP';
COMMENT ON COLUMN companies.phone IS 'Telefone da empresa';
COMMENT ON COLUMN companies.email IS 'Email da empresa';
COMMENT ON COLUMN companies.website IS 'Website da empresa';
COMMENT ON COLUMN companies.contact_person IS 'Pessoa de contato';
COMMENT ON COLUMN companies.contact_phone IS 'Telefone de contato';
COMMENT ON COLUMN companies.contact_email IS 'Email de contato';
COMMENT ON COLUMN companies.description IS 'Descrição da empresa';
COMMENT ON COLUMN companies.status IS 'Status da empresa (ACTIVE, INACTIVE, PENDING, SUSPENDED)';
COMMENT ON COLUMN companies.type IS 'Tipo da empresa (LTDA, ME, EIRELI, S.A, etc.)';
COMMENT ON COLUMN companies.sector IS 'Setor de atuação';
COMMENT ON COLUMN companies.size IS 'Tamanho da empresa (Pequena, Média, Grande)';
COMMENT ON COLUMN companies.annual_revenue IS 'Receita anual';
COMMENT ON COLUMN companies.employee_count IS 'Número de funcionários';
COMMENT ON COLUMN companies.notes IS 'Observações';
COMMENT ON COLUMN companies.created_at IS 'Data de criação';
COMMENT ON COLUMN companies.updated_at IS 'Data de atualização';
COMMENT ON COLUMN companies.created_by IS 'ID do usuário que criou';
COMMENT ON COLUMN companies.updated_by IS 'ID do usuário que atualizou';

-- Adicionar foreign key para company_id na tabela employees (se a coluna já existir)
DO $$
BEGIN
    -- Verifica se a coluna company_id existe na tabela employees
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'employees' AND column_name = 'company_id') THEN
        -- Adiciona a foreign key se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_company') THEN
            ALTER TABLE employees 
            ADD CONSTRAINT fk_employees_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$; 