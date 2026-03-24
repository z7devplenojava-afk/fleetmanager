-- Adicionar campos de endereço separados e telefone de contato à tabela employees

-- Campos de endereço separados
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS endereco_rua VARCHAR(255),
    ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20),
    ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(100),
    ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100),
    ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(100),
    ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR(2),
    ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(10);

-- Campo telefone de contato
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS telefone_contato VARCHAR(20);

-- Comentários nas colunas
COMMENT ON COLUMN employees.endereco_rua IS 'Rua/Logradouro do endereço';
COMMENT ON COLUMN employees.endereco_numero IS 'Número do endereço';
COMMENT ON COLUMN employees.endereco_complemento IS 'Complemento do endereço (apto, bloco, etc)';
COMMENT ON COLUMN employees.endereco_bairro IS 'Bairro do endereço';
COMMENT ON COLUMN employees.endereco_cidade IS 'Cidade do endereço';
COMMENT ON COLUMN employees.endereco_estado IS 'Estado (UF) do endereço';
COMMENT ON COLUMN employees.endereco_cep IS 'CEP do endereço';
COMMENT ON COLUMN employees.telefone_contato IS 'Telefone de contato alternativo';

