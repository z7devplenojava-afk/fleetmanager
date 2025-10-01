CREATE TABLE registros_ponto (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 