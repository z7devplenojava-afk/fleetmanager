ALTER TABLE employees
ADD COLUMN IF NOT EXISTS titulo_eleitor_data_expedicao DATE,
ADD COLUMN IF NOT EXISTS titulo_eleitor_validade DATE,
ADD COLUMN IF NOT EXISTS nome_conselho_regional VARCHAR(100);



