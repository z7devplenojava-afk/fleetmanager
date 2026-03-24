-- Adicionar campos separados de endereço na tabela companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS endereco_rua VARCHAR(255),
ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(100),
ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100);


