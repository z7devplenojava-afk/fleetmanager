-- ====================================================================
-- V4677: Adiciona work_post_id e department_id na tabela employees
-- ====================================================================

-- 1. Adicionar colunas se não existirem
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- 2. Criar índices para performance de buscas e joins
CREATE INDEX IF NOT EXISTS idx_employees_work_post_id ON employees(work_post_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);

