-- Adiciona coluna company_id para isolamento multi-tenant na tabela time_records
-- Corrige falha de segurança: TimeRecord não tinha @Filter nem company_id

ALTER TABLE time_records ADD COLUMN IF NOT EXISTS company_id UUID;

-- Preencher company_id dos registros existentes baseado no employee
UPDATE time_records tr
SET company_id = e.company_id
FROM employees e
WHERE tr.employee_id = e.id
  AND tr.company_id IS NULL;

-- Tornar company_id NOT NULL após preenchimento
ALTER TABLE time_records ALTER COLUMN company_id SET NOT NULL;

-- Criar índice para performance das queries com tenant filter
CREATE INDEX IF NOT EXISTS idx_time_records_company_id ON time_records(company_id);

-- Recriar índices existentes para incluir company_id (se necessário)
-- O Hibernate @Filter adiciona automaticamente "AND company_id = :companyId" nas queries
