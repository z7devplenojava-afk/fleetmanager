-- Migration V4636: Adicionar campos de Fatura de Locação de Veículos no Contas a Receber
ALTER TABLE accounts_receivable
    ADD COLUMN IF NOT EXISTS fatura_locacao_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS pedido_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS periodo_locacao VARCHAR(100),
    ADD COLUMN IF NOT EXISTS placas_veiculos TEXT,
    ADD COLUMN IF NOT EXISTS dados_bancarios VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nfse_xml_url VARCHAR(500);

ALTER TABLE measurement_bulletins
    ADD COLUMN IF NOT EXISTS fatura_locacao_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS pedido_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS periodo_locacao VARCHAR(100),
    ADD COLUMN IF NOT EXISTS placas_veiculos TEXT,
    ADD COLUMN IF NOT EXISTS dados_bancarios VARCHAR(255);
