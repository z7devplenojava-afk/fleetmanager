-- Migration para atualizar tabela de centros de custo
-- V315__create_cost_centers_table.sql

-- Adicionar colunas que faltam na tabela existente
ALTER TABLE cost_centers 
ADD COLUMN IF NOT EXISTS responsible VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS current_spent DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Alterar tamanhos das colunas existentes
ALTER TABLE cost_centers ALTER COLUMN code TYPE VARCHAR(20);
ALTER TABLE cost_centers ALTER COLUMN name TYPE VARCHAR(255);
ALTER TABLE cost_centers ALTER COLUMN status TYPE VARCHAR(20);

-- Adicionar valores padrão
ALTER TABLE cost_centers ALTER COLUMN status SET DEFAULT 'ATIVO';

-- Índices para melhorar performance (apenas os que não existem)
CREATE INDEX IF NOT EXISTS idx_cost_centers_status ON cost_centers(status);
CREATE INDEX IF NOT EXISTS idx_cost_centers_department ON cost_centers(department);
CREATE INDEX IF NOT EXISTS idx_cost_centers_responsible ON cost_centers(responsible);

-- Comentários na tabela
COMMENT ON TABLE cost_centers IS 'Tabela para armazenar centros de custo da empresa';
COMMENT ON COLUMN cost_centers.responsible IS 'Nome do responsável pelo centro de custo';
COMMENT ON COLUMN cost_centers.department IS 'Departamento ao qual o centro de custo pertence';
COMMENT ON COLUMN cost_centers.budget IS 'Orçamento disponível para o centro de custo';
COMMENT ON COLUMN cost_centers.current_spent IS 'Valor atual gasto pelo centro de custo';
COMMENT ON COLUMN cost_centers.created_by IS 'ID do usuário que criou o registro';
COMMENT ON COLUMN cost_centers.updated_by IS 'ID do usuário que fez a última atualização';

-- Inserir dados de exemplo (apenas se não existirem)
INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC001', 'Administração', 'Centro de custo para despesas administrativas', 'João Silva', 'Administrativo', 50000.00, 35000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC001' OR name = 'Administração');

INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC002', 'Vendas', 'Centro de custo para atividades de vendas', 'Maria Santos', 'Comercial', 80000.00, 45000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC002' OR name = 'Vendas');

INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC003', 'Produção', 'Centro de custo para produção e manufatura', 'Pedro Costa', 'Operacional', 120000.00, 95000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC003' OR name = 'Produção');

INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC004', 'TI', 'Centro de custo para tecnologia da informação', 'Ana Oliveira', 'Tecnologia', 30000.00, 28000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC004' OR name = 'TI');

INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC005', 'Marketing', 'Centro de custo para atividades de marketing', 'Carlos Lima', 'Marketing', 40000.00, 15000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC005' OR name = 'Marketing');

INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC006', 'RH', 'Centro de custo para recursos humanos', 'Fernanda Souza', 'Recursos Humanos', 25000.00, 18000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC006' OR name = 'RH');

INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC007', 'Financeiro', 'Centro de custo para atividades financeiras', 'Roberto Alves', 'Financeiro', 35000.00, 22000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC007' OR name = 'Financeiro');

INSERT INTO cost_centers (id, code, name, description, responsible, department, budget, current_spent, status, created_at, updated_at) 
SELECT gen_random_uuid(), 'CC008', 'Manutenção', 'Centro de custo para manutenção de equipamentos', 'Paulo Mendes', 'Operacional', 15000.00, 12000.00, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'CC008' OR name = 'Manutenção');
