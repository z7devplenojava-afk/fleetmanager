CREATE TABLE IF NOT EXISTS extracted_holerite_data (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    codigo VARCHAR(50),
    cargo VARCHAR(255),
    mes_referencia VARCHAR(2),
    ano_referencia INTEGER,
    created_at TIMESTAMP NOT NULL
); 