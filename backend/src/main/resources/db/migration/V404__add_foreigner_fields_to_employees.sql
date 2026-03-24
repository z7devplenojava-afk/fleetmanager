-- Adicionar campos para estrangeiros ao Employee
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS rne_numero VARCHAR(30),
ADD COLUMN IF NOT EXISTS rne_validade DATE,
ADD COLUMN IF NOT EXISTS ric_numero VARCHAR(30),
ADD COLUMN IF NOT EXISTS ric_orgao_emissor VARCHAR(50),
ADD COLUMN IF NOT EXISTS ric_data_emissao DATE,
ADD COLUMN IF NOT EXISTS tipo_visto VARCHAR(50);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_employees_rne_numero ON employees(rne_numero);
CREATE INDEX IF NOT EXISTS idx_employees_ric_numero ON employees(ric_numero);



