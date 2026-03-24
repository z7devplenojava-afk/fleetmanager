CREATE TABLE tb_extract_data_holerites (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    codigo VARCHAR(50),
    mes_referencia VARCHAR(7) NOT NULL,
    ano_referencia INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tb_extract_data_holerites_cpf ON tb_extract_data_holerites (cpf); 