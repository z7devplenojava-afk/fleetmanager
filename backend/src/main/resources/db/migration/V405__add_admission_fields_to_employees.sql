-- Adicionar campos de admissão ao Employee
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS horario_trabalho_intervalo VARCHAR(100),
ADD COLUMN IF NOT EXISTS dias_trabalho VARCHAR(20),
ADD COLUMN IF NOT EXISTS prazo_experiencia_texto VARCHAR(50),
ADD COLUMN IF NOT EXISTS prorrogacao_experiencia VARCHAR(50);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_employees_dias_trabalho ON employees(dias_trabalho);



