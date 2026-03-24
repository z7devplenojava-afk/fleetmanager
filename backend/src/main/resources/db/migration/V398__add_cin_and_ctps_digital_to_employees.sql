-- Adicionar campos CIN (Carteira de Identidade Nacional) e CTPS Digital PDF à tabela employees

-- Campos CIN
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS cin_numero VARCHAR(30),
    ADD COLUMN IF NOT EXISTS cin_orgao_emissor VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cin_data_emissao DATE;

-- Campos CTPS Digital PDF
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS ctps_digital_pdf BYTEA,
    ADD COLUMN IF NOT EXISTS ctps_digital_pdf_nome VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ctps_digital_pdf_tamanho BIGINT;

-- Comentários nas colunas
COMMENT ON COLUMN employees.cin_numero IS 'Número da Carteira de Identidade Nacional (CIN)';
COMMENT ON COLUMN employees.cin_orgao_emissor IS 'Órgão emissor da CIN';
COMMENT ON COLUMN employees.cin_data_emissao IS 'Data de emissão da CIN';
COMMENT ON COLUMN employees.ctps_digital_pdf IS 'Arquivo PDF da CTPS Digital em formato binário';
COMMENT ON COLUMN employees.ctps_digital_pdf_nome IS 'Nome do arquivo PDF da CTPS Digital';
COMMENT ON COLUMN employees.ctps_digital_pdf_tamanho IS 'Tamanho do arquivo PDF da CTPS Digital em bytes';

