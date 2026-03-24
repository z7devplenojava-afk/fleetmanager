-- Adicionar campo department_id na tabela vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS department_id UUID;

-- Adicionar constraint de chave estrangeira
ALTER TABLE vehicles
ADD CONSTRAINT fk_vehicles_department
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_vehicles_department_id ON vehicles(department_id);

-- Comentário para documentação
COMMENT ON COLUMN vehicles.department_id IS 'ID do departamento responsável pelo veículo (opcional)';
