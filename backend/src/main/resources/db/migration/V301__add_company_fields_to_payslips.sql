-- Adicionar campos de empresa na tabela payslips
ALTER TABLE payslips 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_cnpj VARCHAR(20);

-- Criar índice para melhorar performance na consulta de duplicidade
CREATE INDEX IF NOT EXISTS idx_payslips_company_cpf_period 
ON payslips(company_cnpj, cpf, month, year);

