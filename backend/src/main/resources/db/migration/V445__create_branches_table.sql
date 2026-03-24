-- Migration V445: Create branches table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    sigla VARCHAR(10) NOT NULL,
    company_id UUID NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_branches_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Indices for better performance
CREATE INDEX idx_branches_company_id ON branches(company_id);
CREATE INDEX idx_branches_sigla ON branches(sigla);
CREATE INDEX idx_branches_active ON branches(active);

-- Comments
COMMENT ON TABLE branches IS 'Tabela que armazena as filiais das empresas';
COMMENT ON COLUMN branches.id IS 'ID único da filial';
COMMENT ON COLUMN branches.name IS 'Nome da filial';
COMMENT ON COLUMN branches.sigla IS 'Sigla da filial';
COMMENT ON COLUMN branches.company_id IS 'ID da empresa à qual a filial pertence';
COMMENT ON COLUMN branches.description IS 'Descrição ou observações da filial';
COMMENT ON COLUMN branches.active IS 'Indica se a filial está ativa';
