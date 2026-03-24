-- Adicionar campo company_id na tabela vehicles
-- Para relacionar veículos com empresas (opcional)

-- Adicionar a coluna company_id
ALTER TABLE vehicles ADD COLUMN company_id UUID;

-- Adicionar foreign key constraint
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Adicionar índice para melhor performance
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);

-- Comentário na coluna
COMMENT ON COLUMN vehicles.company_id IS 'ID da empresa proprietária do veículo (opcional)';
